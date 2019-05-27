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

/* external dependencies */
import { EventEmitter } from 'events';
import { Request, Router, Application } from 'express';
import { Connection, Document, Model } from 'mongoose';
import appRootObject = require('app-root-path');
import path = require('path');
const appRoot = appRootObject.toString();

/* import all required modules */

/* server class abd functions */
import { Server } from './server/serverOps';
import { startServer } from './server/startserver';
import { runServer } from './server/runServer';
/* a configured morgan http(s) server logger */
import { ServerLogger } from './server/serverlogger';
// a configured winston general logger
import { Logger } from '../../utils/src/logger';
/* a utility to dump errors to the logger */
import { DumpError } from '../../utils/src/dumpError';
/* access to debug logger for mocha - must be imported this way */
import * as ERROR_HANDLERS from './handlers/errorhandler';
/* error handler middleware functions */
const errorHandlers = ERROR_HANDLERS.errorHandlers;
/* database class and creation function */
import { Database, runDatabaseApp } from '../../database/src/index';
/* models */
import { createModelTests } from '../../models/src/tests';
import { createModelMembers } from '../../models/src/members';
/* controllers */
import { failController } from './controllers/fail';
/* handlers for /members api */
import { membersApi } from './handlers/api/membersApi';
/* 2nd level members handlers */
import * as membersHandlers from './handlers/membersHandlers';
// shared request handler functions
import { miscHandlers } from './handlers/miscHandlers';
import winston = require('winston');

// tslint:disable:object-literal-sort-keys
export const config = {
  /***********************************************************************/
  /* Internal imports                                                    */
  /***********************************************************************/

  /**
   * This section sets up imports for all the internal modules.
   */
  Server,
  startServer,
  runServer,
  ServerLogger,
  Logger,
  DumpError,
  ERROR_HANDLERS,
  errorHandlers,
  runDatabaseApp,
  createModelTests,
  createModelMembers,
  failController,
  membersApi,
  membersHandlers,
  miscHandlers,

  /***********************************************************************/
  /* Misc application parameters                                         */
  /***********************************************************************/

  /**
   * This section sets misc configuration parameters used by the
   * application programme.
   */

  ENV_FILE: path.join(appRoot, '.env'),
  /* ok to start server if database fails to start? */
  IS_NO_DB_OK: true,
  /* directory for logs used by all backend components */
  LOGS_DIR: path.join(appRoot, 'logs'),
  // 'development' or 'production'
  ENV: 'development',

  /***********************************************************************/
  /* Angular app parameters                                              */
  /***********************************************************************/

  /**
   * This section sets parameters used by the Angular app.
   */

  APP_PATH: path.join(appRoot, '..', 'frontend', 'dist'),

  /***********************************************************************/
  /* HTTP/S server parameters                                            */
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
  // path to static server for server tests
  STATIC_TEST_PATH: path.join(appRoot, 'dist', 'server', 'test', 'client'),
  NODE_MODULES_PATH: path.join(appRoot, 'node_modules'),

  /***********************************************************************/
  /* Morgan server logger parameters                                     */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the Morgan server
   * logger.
   */

  // sets morgan http logger format
  MORGAN_FORMAT:
    ':id :remote-addr [:date[clf]]' +
    ' :method :url :status :res[content-length]',
  // directory for server log files
  get MORGAN_LOGS_DIR() {
    return this.LOGS_DIR;
  },
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
  MONITOR_FOREVER_LOG: path.join('monitorForever.log'),
  // child stdout log
  get MONITOR_OUT_LOG() {
    return path.join(this.LOGS_DIR, 'monitorOut.log');
  },
  // child stderr log
  get MONITOR_ERR_LOG() {
    return path.join(this.LOGS_DIR, 'monitorErr.log');
  },

  /***********************************************************************/
  /* API middleware configuration                                           */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the API middleware.
   */
  API_FILE: path.join(appRoot, 'api', 'openapi.json'),
};

/***********************************************************************/
/* Types                                                               */
/***********************************************************************/

/* the Server class is the type for instances if the Server class */
export type Server = Server;
/* the Database class is the type for instances of the Database class */
export type Database = Database;

/* controllers object */
export interface IControllers {
  [key: string]: Router;
}

/* extend Model to include autoinc resetCounter() */
interface IModelExtended extends Model<Document, {}> {
  resetCount: () => void;
  nextCount: () => number;
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
  dumpError: (err: any) => void;
  /* error handler middleware */
  errorHandler: typeof errorHandlers;
  /* event emitter used for test */
  event: EventEmitter;
  /* logger service */
  logger: winston.Logger;
  /* handles object*/
  miscHandlers: typeof miscHandlers;
  membersApi: typeof membersApi;
  memberhandlers: typeof membersHandlers;
  /* database models object */
  models: {
    tests: Model<Document, {}>;
    members: IModelExtended;
  };
  /* morgan server logger */
  serverLogger: ServerLogger;
  /* created http(s) servers */
  servers: Server[];
}

/* extension of Express type to support appLocals */
export interface IExpressApp extends Application {
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

export interface IMemberNoId {
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

export type typeSigInt = () => Promise<void>;
export type typeUncaught = (err: any) => Promise<void>;

/* create type for the index.ts export (for mocha) */
export interface IServerIndex {
  debug?: any; // see notes
  appLocals: IAppLocals;
  event: EventEmitter;
  sigint: typeSigInt;
  uncaughtException: typeUncaught;
  unhandledRejection: typeUncaught;
}
