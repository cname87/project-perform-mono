"use strict";
/**
 * This application runs a http(s) server with a database backend.
 * It creates a controllers object listing the supported base controllers.
 * It creates a handles object listing the supported handlers.
 * It creates a 'objects' object which is used to store the database connection,
 * database session information and server information for use throughout
 * the application.
 * It reads a server configuration file into a configuration object
 * It attempts to start the database and then starts the server,
 * injecting the above controllers, handles and communication
 * and configuration objects.
 * It can start the server in the absence of a database connection
 * if the configuration file is so configured.
 * It can be stopped via a SIGINT, or if started via a forever
 * monitoring service via a message from the forever process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* Note: All exports are for mocha. */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
exports.debug = debug_1.default(`PP_${modulename}`);
exports.debug(`Starting ${modulename}`);
/* import configuration file */
const _config_1 = require("./.config");
/* external dependencies */
const assert_1 = require("assert");
const events_1 = require("events");
const express_1 = tslib_1.__importDefault(require("express"));
/* app used by closeAll which can be called from external
 * => a module variable */
let app = {};
/* event emitter needed by Mocha before server up */
exports.event = new events_1.EventEmitter();
/* server */
const startServer = _config_1.config.START_SERVER;
const runServer = _config_1.config.RUN_SERVER;
/* database */
const { runDatabaseApp } = _config_1.config.DATABASE;
/* middleware */
const { handlers } = _config_1.config.HANDLERS;
const errorHandler = _config_1.config.ERROR_HANDLER;
/* route controllers */
const { router: controllerRoot } = _config_1.config.ROOT_CONTROLLER;
const { router: controllerFail } = _config_1.config.FAIL_CONTROLLER;
/* database models */
const { createModel: usersModels } = _config_1.config.USERSMODEL;
const { createModel: testsModels } = _config_1.config.TESTSMODEL;
/* Create the single instances of the general logger & dumpError
 * utilities, and the server logger middleware.
 * These are passed via the app.locals object.
 * Also, other modules can create new instances later without the parameter
 * and they will receive the same instance. */
const { Logger } = _config_1.config.LOGGER;
const logger = Logger.getInstance(_config_1.config);
const { DumpError } = _config_1.config.DUMPERROR;
const dumpError = DumpError.getInstance(logger);
const { ServerLogger } = _config_1.config.SERVER_LOGGER;
const serverLogger = new ServerLogger(_config_1.config);
async function uncaughtException(err) {
    exports.debug(modulename + ': running uncaughtException');
    /* note: a process.uncaughtException also logs the trace to console.error */
    logger.error(modulename + ': uncaught exception');
    dumpError(err);
    await closeAll();
    process.exit(-11);
}
exports.uncaughtException = uncaughtException;
/* capture all uncaught application exceptions (only once) */
process.once('uncaughtException', uncaughtException);
// *** Switch to uncaughtException or otherwise avoid hacking process.
/* use process.thrownException instead of uncaughtException to throw
 * errors internally */
process.once('thrownException', uncaughtException);
async function unhandledRejection(reason) {
    exports.debug(modulename + ': running unhandledRejection');
    logger.error(modulename + ': unhandled promise rejection');
    dumpError(reason);
    await closeAll();
    process.exit(-12);
}
exports.unhandledRejection = unhandledRejection;
/* capture unhandled promise rejection (only once) */
process.once('unhandledRejection', unhandledRejection);
/**
 * Called to set up a database connection.
 * @param  objects
 * The database connection is returned in objects['dbConnection'].
 * @returns
 * Returns a promise.
 * If the connection is successful, then objects['dbConnection']
 * will contain the database connection instance.
 * If the connection to the database fails then objects['dbConnection']
 * will be empty.
 */
function load() {
    exports.debug(modulename + ': running load');
    const controllers = {};
    controllers.root = controllerRoot;
    controllers.fail = controllerFail;
    const handles = {};
    handles.raiseEvent = handlers.raiseEvent;
    /* server error handler */
    handles.errorHandler = errorHandler;
    /**
     * @description
     * The express app is provided an app.locals object containing
     * (i) constants & set-up objects, e.g. config object, database connection.
     * (iii) objects/variables needed across requests.
     * app.locals is passed to run the application and is also passed on
     * to downstream functions.
     */
    const appLocals = {
        // *** constants & set up objects ***
        /* application config object */
        config: _config_1.config,
        /* controllers object */
        controllers,
        /* connection instance to a mongoDB database on a server */
        dbConnection: {},
        /* error logger */
        dumpError,
        /* event emitter used for test */
        event: exports.event,
        /* handles object*/
        handles,
        /* winston general logger */
        logger,
        /* database models object */
        models: {},
        /* mongo connection for express session store */
        mongoStore: {},
        /* morgan server logger */
        serverLogger,
        /* created http(s) servers */
        servers: [],
        /* express session store */
        sessionStore: {},
    };
    app = express_1.default();
    Object.assign(app.locals, appLocals);
    return app;
}
// async function setupDatabase(obj: IObjects) {
//   debug(modulename + ': running setupDatabase');
//   logger.info('\n*** CONNECTING TO THE DATABASE ***\n');
//   try {
//     const database = runDatabaseApp();
//     obj.dbConnection = database.dbConnection;
//     return;
//   } catch (err) {
//     /* deal with error in caller */
//     return;
//   }
// }
let database;
/* Run the application */
async function runApp() {
    exports.debug(modulename + ': running runApp');
    logger.info('\n*** STARTING THE APPLICATION ***\n');
    const obj = app.locals;
    try {
        exports.debug(modulename + ': calling the database');
        database = await runDatabaseApp();
        obj.dbConnection = database.dbConnection;
        if (obj.dbConnection.readyState === 1) {
            exports.debug(modulename + ': database set up complete');
            /* generate the models object */
            obj.models.Users = usersModels(obj.dbConnection, database);
            obj.models.Tests = testsModels(obj.dbConnection, database);
        }
        else {
            logger.error(modulename + ': database failed to connect');
        }
    }
    catch (err) {
        logger.error(modulename + ': database start up error - exiting');
        dumpError(err);
        await closeAll();
        exports.debug(modulename + ': will exit with code -5');
        process.exitCode = -5;
    }
    /* call the http server if db connected or not needed
     * otherwise exit */
    if (obj.dbConnection.readyState === 1 || obj.config.IS_NO_DB_OK) {
        exports.debug(modulename + ': calling the http server');
        logger.info('\n*** STARTING SERVER ***\n');
        /* start the server */
        try {
            await startServer.startServer(app);
            /* set up an error handlers for the servers */
            for (const server of obj.servers) {
                server.expressServer.on('error', async (err) => {
                    logger.error(modulename + ': Unexpected server error - exiting');
                    dumpError(err);
                    await closeAll();
                    exports.debug(modulename + ': will exit with code -3');
                    process.exitCode = -3;
                });
            }
            /* run the server functionality */
            runServer.runServer(app);
            exports.debug(modulename + ': server up and running');
            /* raise an event that mocha can read */
            const arg = {
                message: 'Server running 0',
            };
            obj.event.emit('indexRunApp', arg);
            /* if started from forever signal that server is up */
            if (process.send) {
                process.send('Server is running');
            }
            logger.info('\n*** SERVER UP AND RUNNING ***\n');
        }
        catch (err) {
            logger.error(modulename + ': server start up error - exiting');
            dumpError(err);
            await closeAll();
            exports.debug(modulename + ': will exit with code -2');
            process.exitCode = -2;
        }
    }
    else {
        logger.error(modulename + ': no database connection - exiting');
        await closeAll();
        exports.debug(modulename + ': will exit with code -1');
        process.exitCode = -1;
    }
}
/* closes all server and database connections */
async function closeAll() {
    const obj = app.locals;
    try {
        exports.debug(modulename + ': closing connections...');
        for (const svr of obj.servers) {
            await svr.stopServer();
            svr.expressServer.removeAllListeners();
        }
        if (Object.keys(obj.dbConnection).length !== 0) {
            await database.closeConnection(obj.dbConnection);
        }
        if (Object.keys(obj.mongoStore).length !== 0) {
            await database.closeStore(obj.mongoStore);
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
async function sigint() {
    exports.debug(modulename + ': running sigint');
    await closeAll();
    exports.debug(modulename + ': SIGINT - will exit normally with code 0');
    logger.info('\n*** CLOSING THE SERVER ON SIGINT REQUEST ***\n');
    /* raise an event that mocha can read */
    const arg = {
        message: 'Server exit 0',
        number: 0,
    };
    app.locals.event.emit('indexSigint', arg);
}
exports.sigint = sigint;
/* registers an event handler for SIGINT
 * event triggers if CTRL+C pressed */
process.on('SIGINT', sigint);
async function parentMessage(message) {
    exports.debug(modulename +
        `: received '${message.action}' ` +
        'message from forever process');
    assert_1.strict.deepStrictEqual(message.action, 'close', "The only supported message is 'close'");
    await closeAll();
    exports.debug(modulename + ': exiting child process');
    logger.info('\n*** CLOSING THE SERVER ON MONITOR REQUEST ***\n');
    process.exit(message.code);
}
/**
 * process.send is true if started by forever. The 'message' event
 * triggers if forever exits on a SIGINT i.e. CTRL+C pressed.
 * A code is returned to tell forever that this exit should
 * not be subject to a restart
 */
if (process.send) {
    process.on('message', parentMessage);
}
load();
runApp();
exports.appObjects = app.locals;
//# sourceMappingURL=index.js.map