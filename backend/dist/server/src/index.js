"use strict";
/**
 * This application runs a http(s) server with a database backend.
 *
 * It creates an object with key items which it attaches to the express app application so it is accessible by all middleware.
 *
 * It attempts to start the database and then starts the server.
 *
 * It can start the server in the absence of a database connection
 * if the configuration file is so configured.
 *
 * It can be stopped via a SIGINT, or if started via a forever
 * monitoring service via a message from the forever process.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* import configuration parameters into process.env */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
/* file header */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
exports.debug = debug_1.default(`PP_${modulename}`);
exports.debug(`Starting ${modulename}`);
/* external dependencies */
const assert_1 = require("assert");
const events_1 = require("events");
const express = require("express");
/* import configuration object */
const configServer_1 = require("./configServer");
/*
 * Define aliases for config parameters.
 */
/* server initiation methods */
const { runServer, startServer } = configServer_1.config;
/* database creation function */
const { runDatabaseApp } = configServer_1.config;
/* handlers used by controllers */
const { miscHandlers, membersApi } = configServer_1.config;
/* errorHandler middleware */
const { errorHandlers } = configServer_1.config;
/* route controllers */
const { apiController, failController } = configServer_1.config;
/* database models */
const { createModelTests } = configServer_1.config;
/* Create the single instances of the general logger & dumpError utilities, and the server logger middleware.  These are passed via the appLocals object. Also, other modules can create new instances later without any parameters and they will receive the same instance. */
const Logger = configServer_1.config.Logger;
const logger = new Logger();
const DumpError = configServer_1.config.DumpError;
const dumpError = new DumpError(logger);
const { ServerLogger } = configServer_1.config;
const serverLogger = new ServerLogger(configServer_1.config);
/**
 * An applocals object is added to the express app object containing objects and variables needed across requests.
 */
const appLocals = {};
appLocals.config = configServer_1.config;
/* generate the controllers object */
const controllers = {};
controllers.fail = failController;
controllers.api = apiController;
appLocals.controllers = controllers;
/* appLocals.database filled during server startup */
/* appLocals.dbConnection filled during server startup */
appLocals.dumpError = dumpError;
appLocals.errorHandler = errorHandlers;
/* event emitter to signal server up etc */
/* create before db setup call as async nature of db setup means index exports before db up and index.event definition needed by mocha so it can await server up event */
const event = new events_1.EventEmitter();
appLocals.event = event;
appLocals.miscHandlers = miscHandlers;
appLocals.membersApi = membersApi;
appLocals.logger = logger;
/* appLocals.models filled during server startup */
appLocals.serverLogger = serverLogger;
/* the express app used throughout */
/* add the appLocals object for access in middleware */
const app = Object.assign(express(), { appLocals });
/**
 * Handles uncaught exceptions.
 * @param err Error passed in by error handler.
 */
const uncaughtException = async (err) => {
    exports.debug(modulename + ': running uncaughtException');
    /* note: process.uncaughtException also logs the trace to console.error */
    logger.error(modulename + ': uncaught exception');
    dumpError(err);
    await closeAll();
    process.exit(-11);
};
/* capture all uncaught application exceptions (only once) */
process.once('uncaughtException', uncaughtException);
/* use process.thrownException instead of uncaughtException to throw
 * errors internally */
process.once('thrownException', uncaughtException);
/**
 * Handles unhandled rejection.
 * @param reason Reason passed in by error handler.
 */
const unhandledRejection = async (reason) => {
    exports.debug(modulename + ': running unhandledRejection');
    logger.error(modulename + ': unhandled promise rejection');
    dumpError(reason);
    await closeAll();
    process.exit(-12);
};
/* capture unhandled promise rejection (only once) */
process.once('unhandledRejection', unhandledRejection);
/**
 * Initiate the server creation.
 */
async function runApp() {
    exports.debug(modulename + ': running runApp');
    logger.info('\n*** STARTING THE APPLICATION ***\n');
    let isDbReady = 0 /* Disconnected */;
    try {
        exports.debug(modulename + ': calling the database');
        /* create a database connection */
        /* the database will be either a test or production database depending on an env parameter */
        const database = await runDatabaseApp();
        appLocals.database = database;
        /* obtain the database connection object */
        const dbConnection = database.dbConnection;
        appLocals.dbConnection = dbConnection;
        /* read whether database is indeed connected or not */
        isDbReady = appLocals.dbConnection.readyState;
        if (isDbReady === 1 /* Connected */) {
            exports.debug(modulename + ': database set up complete');
            /* create the database models (i.e. the mongoDB collection connections) */
            appLocals.models = {};
            appLocals.models.tests = createModelTests(database);
            /* appLocals.models.members is created when an api function is called */
        }
        else {
            logger.error(modulename + ': database failed to connect');
        }
    }
    catch (err) {
        /* log error but proceed */
        logger.error(modulename + ': database start up error - continuing');
        dumpError(err);
    }
    /* call the http server if db connected or not needed, otherwise exit */
    if (isDbReady === 1 /* Connected */ || configServer_1.config.IS_NO_DB_OK) {
        exports.debug(modulename + ': calling the http server');
        logger.info('\n*** STARTING SERVER ***\n');
        /* start the server */
        try {
            /* holds connected servers */
            const servers = [];
            await startServer(app, servers, // filled with connected server on return
            configServer_1.config, logger, dumpError);
            appLocals.servers = servers;
            /* set up an error handlers for the servers */
            for (const server of servers) {
                server.expressServer.on('error', async (err) => {
                    logger.error(modulename + ': Unexpected server error - exiting');
                    dumpError(err);
                    await closeAll(appLocals.servers, appLocals.database);
                    exports.debug(modulename + ': will exit with code -3');
                    process.exitCode = -3;
                });
            }
            /* run the server functionality */
            await runServer(app, configServer_1.config, controllers, errorHandlers, miscHandlers, serverLogger);
            exports.debug(modulename + ': server up and running');
            /* raise an event that mocha can read */
            const arg = {
                message: 'Server running 0',
            };
            appLocals.event.emit('indexRunApp', arg);
            /* if started from forever signal that server is up */
            if (process.send) {
                process.send('Server is running');
            }
            if (isDbReady === 1 /* Connected */) {
                logger.info(`\n*** DATABASE CONNECTED ***`);
            }
            else {
                logger.error(`\n*** DATABASE NOT CONNECTED ***`);
            }
            logger.info(`\n*** SERVER LISTENING ON PORT ${configServer_1.config.PORT} ***`);
        }
        catch (err) {
            logger.error(modulename + ': server start up error - exiting');
            dumpError(err);
            await closeAll(appLocals.servers, appLocals.database);
            exports.debug(modulename + ': will exit with code -2');
            process.exitCode = -2;
        }
    }
    else {
        logger.error(modulename + ': no database connection - exiting');
        await closeAll(appLocals.servers, appLocals.database);
        exports.debug(modulename + ': will exit with code -1');
        process.exitCode = -1;
    }
}
/**
 * Shuts down the application gracefully.
 */
const sigint = async () => {
    exports.debug(modulename + ': running sigint');
    await closeAll();
    exports.debug(modulename + ': SIGINT - will exit normally with code 0');
    logger.info('\n*** CLOSING THE SERVER ON SIGINT REQUEST ***\n');
    /* raise an event that mocha can read */
    const arg = {
        message: 'Server exit 0',
        number: 0,
    };
    appLocals.event.emit('indexSigint', arg);
};
/**
 * Closes all server and database connections
 * @param servers Array of created servers.
 * @param database Created database instance.
 */
async function closeAll(servers = appLocals.servers, database = appLocals.database) {
    try {
        exports.debug(modulename + ': closing connections...');
        if (servers && servers.length > 0) {
            for (const svr of servers) {
                await svr.stopServer();
                svr.expressServer.removeAllListeners();
            }
        }
        if (database) {
            await database.closeConnection(database.dbConnection);
        }
        process.removeListener('SIGINT', sigint);
        process.removeListener('uncaughtException', uncaughtException);
        process.removeListener('unhandledRejection', unhandledRejection);
        process.removeListener('thrownException', uncaughtException);
        process.removeListener('message', parentMessage);
        exports.debug(modulename + ': all connections & listeners closed');
        return;
    }
    catch (err) {
        /* unexpected error - don't call uncaught/rejected */
        logger.error(modulename + ': closeAll error - exiting');
        dumpError(err);
        exports.debug(modulename + ': will exit with code -4');
        process.exitCode = -4;
    }
}
/**
 * Registers an event handler for SIGINT.
 * Event triggers if CTRL+C pressed
 */
process.on('SIGINT', sigint);
async function parentMessage(message) {
    exports.debug(modulename +
        `: received '${message.action}' ` +
        'message from forever process');
    assert_1.strict.deepStrictEqual(message.action, 'close', "The only supported message is 'close'");
    await closeAll();
    exports.debug(modulename + ': exiting child process');
    logger.info('\n*** CLOSING THE SERVER ON MONITOR REQUEST ***\n');
    /* a code is returned to tell forever that this exit should not be subject to a restart */
    process.exit(message.code);
}
/**
 * process.send is true if started by forever. The 'message' event
 * triggers if forever exits on a SIGINT i.e. CTRL+C pressed.
 */
if (process.send) {
    process.on('message', parentMessage);
}
/* create the server */
runApp();
/* exports for unit test */
exports.index = {
    appLocals,
    event,
    sigint,
    uncaughtException,
    unhandledRejection,
};
//# sourceMappingURL=index.js.map