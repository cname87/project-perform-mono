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

/* Note: All exports are for mocha. */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* import configuration files */
import { config } from './configServer';
// tslint:disable-next-line: ordered-imports
import * as dotenv from 'dotenv';
dotenv.config({ path: config.ENV_FILE });

/* external dependencies */
import { strict } from 'assert';
import { EventEmitter } from 'events';
import express from 'express';

interface IObjects {
  [key: string]: object | any[];
}

/* app used by closeAll which can be called from external
 * => a module variable */
let app: express.Application = {} as any;

/* event emitter needed by Mocha before server up */
export const event: EventEmitter = new EventEmitter();

/* server */
const startServer = config.START_SERVER;
const runServer = config.RUN_SERVER;
/* database */
const { runDatabaseApp } = config.DATABASE;
/* middleware */
const { handlers } = config.HANDLERS;
const errorHandler = config.ERROR_HANDLER;
/* route controllers */
const { router: controllerFail } = config.FAIL_CONTROLLER;
/* database models */
const { createModel: usersModels } = config.USERSMODEL;
const { createModel: testsModels } = config.TESTSMODEL;

/* Create the single instances of the general logger & dumpError
 * utilities, and the server logger middleware.
 * These are passed via the app.locals object.
 * Also, other modules can create new instances later without the parameter
 * and they will receive the same instance. */
const { Logger } = config.LOGGER;
const logger = Logger.getInstance();
const { DumpError } = config.DUMPERROR;
const dumpError = DumpError.getInstance(logger);
const { ServerLogger } = config.SERVER_LOGGER;
const serverLogger = new ServerLogger(config);

export async function uncaughtException(err: Error) {
  debug(modulename + ': running uncaughtException');

  /* note: a process.uncaughtException also logs the trace to console.error */
  logger.error(modulename + ': uncaught exception');
  dumpError(err);
  await closeAll();
  process.exit(-11);
}

/* capture all uncaught application exceptions (only once) */
process.once('uncaughtException', uncaughtException);

// *** Switch to uncaughtException or otherwise avoid hacking process.
/* use process.thrownException instead of uncaughtException to throw
 * errors internally */
process.once('thrownException', uncaughtException);

export async function unhandledRejection(reason: any) {
  debug(modulename + ': running unhandledRejection');

  logger.error(modulename + ': unhandled promise rejection');
  dumpError(reason);
  await closeAll();
  process.exit(-12);
}

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
  debug(modulename + ': running load');

  /* generate the controllers object */
  /**
   * @description The controllers - routers that direct incoming urls.
   */
  interface IRouters {
    [key: string]: express.Router;
  }
  const controllers: IRouters = {};
  controllers.fail = controllerFail;

  /* handlers used by controllers */
  /**
   * @description The handlers - functions that take actions.
   */
  interface IHandlers {
    [key: string]: () => {};
  }
  const handles: IHandlers = {};
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

  const appLocals: IObjects = {
    // *** constants & set up objects ***

    /* application config object */
    config,
    /* controllers object */
    controllers,
    /* connection instance to a mongoDB database on a server */
    dbConnection: {},
    /* error logger */
    dumpError,
    /* event emitter used for test */
    event,
    /* handles object*/
    handles,
    /* winston general logger */
    logger,
    /* database models object */
    models: {},
    /* morgan server logger */
    serverLogger,
    /* created http(s) servers */
    servers: [],
    /* express session store */
    sessionStore: {},
  };
  app = express();
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

let database: any;

/* Run the application */
async function runApp() {
  debug(modulename + ': running runApp');

  logger.info('\n*** STARTING THE APPLICATION ***\n');

  const obj = app.locals;

  try {
    debug(modulename + ': calling the database');
    database = await runDatabaseApp();
    obj.dbConnection = database.dbConnection;

    if (obj.dbConnection.readyState === 1) {
      debug(modulename + ': database set up complete');

      /* generate the models object */
      obj.models.Users = usersModels(obj.dbConnection, database);
      obj.models.Tests = testsModels(obj.dbConnection, database);
    } else {
      logger.error(modulename + ': database failed to connect');
    }
  } catch (err) {
    /* log error but proceed */
    logger.error(modulename + ': database start up error - continuing');
    dumpError(err);
  }

  /* call the http server if db connected or not needed
   * otherwise exit */
  if (obj.dbConnection.readyState === 1 || obj.config.IS_NO_DB_OK) {
    debug(modulename + ': calling the http server');

    logger.info('\n*** STARTING SERVER ***\n');

    /* start the server */
    try {
      await startServer.startServer(app);

      /* set up an error handlers for the servers */
      for (const server of obj.servers) {
        server.expressServer.on('error', async (err: Error) => {
          logger.error(modulename + ': Unexpected server error - exiting');
          dumpError(err);
          await closeAll();
          debug(modulename + ': will exit with code -3');
          process.exitCode = -3;
        });
      }

      /* run the server functionality */
      await runServer.runServer(app);

      debug(modulename + ': server up and running');

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
    } catch (err) {
      logger.error(modulename + ': server start up error - exiting');
      dumpError(err);
      await closeAll();
      debug(modulename + ': will exit with code -2');
      process.exitCode = -2;
    }
  } else {
    logger.error(modulename + ': no database connection - exiting');
    await closeAll();
    debug(modulename + ': will exit with code -1');
    process.exitCode = -1;
  }
}

/* closes all server and database connections */
async function closeAll() {
  const obj = app.locals;

  try {
    debug(modulename + ': closing connections...');

    for (const svr of obj.servers) {
      await svr.stopServer();
      svr.expressServer.removeAllListeners();
    }

    if (Object.keys(obj.dbConnection).length !== 0) {
      await database.closeConnection(obj.dbConnection);
    }

    process.removeListener('SIGINT', sigint);
    process.removeListener('uncaughtException', uncaughtException);
    process.removeListener('unhandledRejection', unhandledRejection);
    process.removeListener('thrownException', uncaughtException);
    process.removeListener('message', parentMessage);

    debug(modulename + ': all connections & listeners closed');

    return;
  } catch (err) {
    /* unexpected error - don't call uncaught/rejected */
    logger.error(modulename + ': closeAll error - exiting');
    dumpError(err);
    debug(modulename + ': will exit with code -4');
    process.exitCode = -4;
  }
}

export async function sigint() {
  debug(modulename + ': running sigint');

  await closeAll();

  debug(modulename + ': SIGINT - will exit normally with code 0');

  logger.info('\n*** CLOSING THE SERVER ON SIGINT REQUEST ***\n');

  /* raise an event that mocha can read */
  const arg = {
    message: 'Server exit 0',
    number: 0,
  };

  app.locals.event.emit('indexSigint', arg);
}

/* registers an event handler for SIGINT
 * event triggers if CTRL+C pressed */
process.on('SIGINT', sigint);

interface IMessage {
  action: string;
  code: number;
}
async function parentMessage(message: IMessage) {
  debug(
    modulename +
      `: received '${message.action}' ` +
      'message from forever process',
  );
  strict.deepStrictEqual(
    message.action,
    'close',
    "The only supported message is 'close'",
  );
  await closeAll();
  debug(modulename + ': exiting child process');

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

export const appObjects = app.locals;
