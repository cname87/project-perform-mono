/**
 * This module sets all configuration parameters for the server application.
 * It also exports all file paths so making changes is easy.
 * It also exports all types used throughout the application.
 * It is imported by index.ts, which passes on all paths and parameters.
 * It is also imported by all other modules to import types only.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/**
 * Import all external dependencies.
 */
import { EventEmitter } from 'events';
import { Express, Request, Router } from 'express';
import { Connection, Document, Model } from 'mongoose';
import * as appRootObject from 'app-root-path';
import * as path from 'path';
const appRoot = appRootObject.toString();

/**
 * Import all required modules.
 */
import { startServer } from './server/startserver';
import { Server } from './server/serverOps';
import { runServer } from './server/runServer';
// a configured morgan http(s) server logger
import { ServerLogger } from './middlewares/serverlogger';
// an express error handler middleware
import * as TEST from './middlewares/errorhandler';
const errorHandlers = TEST.errorHandlers;
// a configured winston general logger
import { Logger, typeLoggerInstance } from '../../utils/src/logger';
// a utility to dump errors to the logger
import { DumpError, typeDumpErrorInstance } from '../../utils/src/dumpError';
// database files
import { Database, runDatabaseApp } from '../../database/src/index';
/* list of controllers */
import { failController } from './controllers/fail';
/* handlers for /api/members */
import * as membersApiHandlers from './handlers/members';
// shared request handler functions
import { miscHandlers } from './middlewares/handlers';
/* list of models */
import { createModelUsers } from '../../models/src/users';
import { createModelTests } from '../../models/src/tests';
import { createModelMembers } from '../../models/src/members';

// tslint:disable:object-literal-sort-keys
export const config = {
  /***********************************************************************/
  /* File paths to all modules                                           */
  /***********************************************************************/

  /**
   * This section sets up application directory structure i.e. paths for
   * all the internal modules.
   */

  /* all modules, not in node_modules, that are imported anywhere */
  /* all are imported above */
  TEST,
  startServer,
  Server,
  runServer,
  miscHandlers,
  ServerLogger,
  errorHandlers,
  Logger,
  DumpError,
  runDatabaseApp,
  failController,
  membersApiHandlers,
  createModelUsers,
  createModelTests,
  createModelMembers,

  /***********************************************************************/
  /* Misc application parameters                                         */
  /***********************************************************************/

  /**
   * This section sets misc configuration parameters used by the
   * application programme.
   */

  /* ok to start server if database fails to start? */
  ENV_FILE: path.join(appRoot, '.env'),
  IS_NO_DB_OK: true,

  /***********************************************************************/
  /* Angular app parameters                                              */
  /***********************************************************************/

  /**
   * This section sets parameters used by the Angular app.
   */

  APP_PATH: path.join(appRoot, '..', 'frontend', 'dist'),

  /***********************************************************************/
  /* HTTP/S server parameters         F                                   */
  /***********************************************************************/

  // port to be listened on
  PORT: 1337,
  // true for https with http on port 80 being redirected
  HTTPS_ON: true,
  // https credentials
  ROOT_CA: path.join(appRoot, 'server', 'certs', 'rootCA.crt'),
  HTTPS_KEY: path.join(appRoot, 'server', 'certs', 'nodeKeyAndCert.pem'),
  HTTPS_CERT: path.join(appRoot, 'server', 'certs', 'nodeKeyAndCert.pem'),
  // cookieparser key
  COOKIE_KEY: 'cookie_key',
  /* number of times a server will attempt to listen on an occupied port
   * a number from 0 to 10 */
  SVR_LISTEN_TRIES: 3,
  /* time between retries in seconds
   * a number between 1 to 10 */
  SVR_LISTEN_TIMEOUT: 3,

  /***********************************************************************/
  /* Express server middleware parameters                                */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters used by the Express
   * server set up.
   */

  // 'development' or 'production'
  ENV: 'development',
  // path to static server for server tests
  STATIC_TEST_PATH: path.join(appRoot, 'server', 'test', 'client', 'browser'),
  // path to favicon
  FAVICON: path.join(appRoot, '..', 'app-test-angular', 'src', 'favicon.ico'),

  /***********************************************************************/
  /* Morgan server logger parameters                                     */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the Morgan server
   * logger middleware.
   */

  // sets morgan http logger format
  MORGAN_FORMAT:
    ':id :remote-addr [:date[clf]]' +
    ' :method :url :status :res[content-length]',
  // morgan logger logs directory
  LOGS_DIR: path.join(appRoot, 'utils', 'logs'),
  // morgan logger stream file name
  MORGAN_STREAM_FILE: 'serverLog.log',

  /***********************************************************************/
  /* forever monitor configuration                                       */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the monitor
   * module that implements monitoring of an executable using the
   * forever package.
   * The monitor module is self-contained i.e. it is not dependent on
   * anything other than a path to this file, which includes the path
   * to the monitored executable.
   */

  // The path to the executable js file
  EXEC_JS: path.join(appRoot, 'dist', 'server', 'src', 'index'),
  // maximum number of child starts triggered by forever
  MAX_STARTS: 10,
  // true for forever to restart child when files change
  // *** Not recommended as not well supported ***
  WATCH_FILES: false,
  // directory to be watched by forever
  WATCH_DIR: appRoot,
  // true for forever to start node executable in debug mode
  get IS_MONITOR_DEBUG() {
    return this.ENV === 'development' ? true : false;
  },
  /* The logs directory referenced in the various log files
   * must exist. */
  // forever log when run as a daemon
  MONITOR_FOREVER_LOG: path.join(
    appRoot,
    'utils',
    'logs',
    'monitorForever.log',
  ),
  // child stdout log
  MONITOR_OUT_LOG: path.join(appRoot, 'utils', 'logs', 'monitorOut.log'),
  // child stderr log
  MONITOR_ERR_LOG: path.join(appRoot, 'utils', 'logs', 'monitorErr.log'),

  /***********************************************************************/
  /* Swagger api configuration                                           */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for swagger-tools.
   */
  API_FILE: path.join(appRoot, 'api', 'openapi.json'),
  CONTROLLERS_PATH: path.join(
    appRoot,
    'dist',
    'server',
    'src',
    'controllers',
    'api',
  ),
};

/***********************************************************************/
/* Types                                                               */
/***********************************************************************/

/* the Server class is the type for instances if the Server class */
export type Server = Server;
/* the Database class is the type for instances of the Database class */
export type Database = Database;
/* the type of instance of the DumpError class */
export type typeDumpErrorInstance = typeDumpErrorInstance;
/* the type of instance of the Logger class */
export type typeLoggerInstance = typeLoggerInstance;
// /* the ServerLogger class is the type for instances of the ServerLogger class */
// export type typeServerLoggerInstance = ServerLogger;

/* controllers object */
export interface IControllers {
  [key: string]: Router;
}

/* models object */
export interface IModels {
  [key: string]: Model<Document, {}>;
}

/* appLocals object */
export interface IAppLocals {
  /* application config object */
  config: typeof config;
  /* controllers */
  controllers: IControllers;
  /* connected mongoDB database */
  database: Database;
  /* database connection */
  dbConnection: Connection;
  /* error logger */
  dumpError: typeDumpErrorInstance;
  /* error handler middleware */
  errorHandler: typeof errorHandlers;
  /* event emitter used for test */
  event: EventEmitter;
  /* handles object*/
  miscHandlers: typeof miscHandlers;
  /* winston general logger */
  logger: typeLoggerInstance;
  /* database models object */
  models: IModels;
  /* morgan server logger */
  serverLogger: ServerLogger;
  /* created http(s) servers */
  servers: Server[];
}

/* extension of Express type to support appLocals */
export interface IExpressApp extends Express {
  appLocals: IAppLocals;
}

/* extension of REQUEST to support appLocals in app */
export interface IRequestApp extends Request {
  app: IExpressApp;
}

/* defines a team member */
export interface IMember {
  name: string;
  id: number;
}

/* extra fields for created errors */
/* Error: 'name' is mandatory, 'message' is optional */
export interface IErr extends Error {
  /* set true to show that the error has been dumped already */
  dumped?: boolean;
  /* add a http status code on creation, which is later written into the http response */
  statusCode?: number;
}

/* allows a custom process event type be used */
interface IProcessExtended {
  once(event: 'thrownException', listener: (err: Error) => Promise<void>): this;
  once(
    event: 'unhandledRejection',
    listener: (err: IErr) => Promise<void>,
  ): this;
  emit(event: 'thrownException', err: Error): boolean;
  /* allows IErr parameter in unhandledrejection */
}

export type processExtended = IProcessExtended & NodeJS.Process;
