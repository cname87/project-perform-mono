/**
 * This module sets all configuration parameters for the
 * server application.
 * It must be stored in the same directory as the index.js file.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import * as appRootObject from 'app-root-path';
import * as path from 'path';
const appRoot = appRootObject.toString();

// tslint:disable:ordered-imports
import * as START_SERVER from './server/startserver';
import * as SERVER from './server/serverOps';
import * as RUN_SERVER from './server/runServer';
// shared request handler functions
import * as HANDLERS from './middlewares/handlers';
// a configured morgan http(s) server logger
import * as SERVER_LOGGER from './middlewares/serverlogger';
// an express error handler middleware
import * as ERROR_HANDLER from './middlewares/errorhandler';
// a configured winston general logger
import * as LOGGER from './utils/logger';
// a utility to dump errors to the logger
import * as DUMPERROR from './utils/dumperror';
// database files
import * as DATABASE from './database/database';
import * as EXT_DB_SERVICE from './database/extDatabaseService';

/* list of controllers */
import * as ROOT_CONTROLLER from './controllers/root';

/* import fail test controller */
import * as FAIL_CONTROLLER from './controllers/fail';

/* list of models */
import * as USERSMODEL from './models/users';
import * as TESTSMODEL from './models/tests';

interface IConfig {
  readonly LOGGER: {
    Logger: typeof LOGGER.Logger;
  };
  readonly DUMPERROR: {
    DumpError: typeof DUMPERROR.DumpError;
  };
  readonly [index: string]: any;
}

// tslint:disable:object-literal-sort-keys
export const config: IConfig = {
  /***********************************************************************/
  /* File paths to all modules                                           */
  /***********************************************************************/

  /**
   * This section sets up application directory structure i.e. paths for
   * all the internal modules.
   */

  /* all modules, not in node_modules, that are imported anywhere */
  /* all are imported above */
  START_SERVER,
  SERVER,
  RUN_SERVER,
  HANDLERS,
  SERVER_LOGGER,
  ERROR_HANDLER,
  LOGGER,
  DUMPERROR,
  DATABASE,
  EXT_DB_SERVICE,
  ROOT_CONTROLLER,
  FAIL_CONTROLLER,
  USERSMODEL,
  TESTSMODEL,

  /***********************************************************************/
  /* Misc application parameters                                         */
  /***********************************************************************/

  /**
   * This section sets misc configuration parameters used by the
   * application programme.
   */

  /* ok to start server if database fails to start? */
  IS_NO_DB_OK: false,
  /* sets the root for all file paths - used to get files */
  ROOT_PATH: appRoot,

  /***********************************************************************/
  /* Angular app parameters                                              */
  /***********************************************************************/

  /**
   * This section sets parameters used by the Angular app.
   */

  APP_PATH: path.join(
    appRoot,
    '..',
    'app-test-angular',
    'dist',
    'angular-tour-of-heroes',
  ),

  /***********************************************************************/
  /* HTTP/S server parameters         F                                   */
  /***********************************************************************/

  // port to be listened on
  PORT: 1337,
  // true for https with http on port 80 being redirected
  HTTPS_ON: true,
  // https credentials
  HTTPS_KEY: path.join(appRoot, 'certs', 'nodeKeyAndCert.pem'),
  HTTPS_CERT: path.join(appRoot, 'certs', 'nodeKeyAndCert.pem'),
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
  // path to the views directory
  PATH_VIEWS: path.join(appRoot, 'src', 'views'),
  // path to static server for server tests
  STATIC_TEST_PATH: path.join(appRoot, 'test', 'client', 'browser'),
  // path to favicon
  FAVICON: path.join(appRoot, 'app-test-angular', 'src', 'favicon.ico'),

  /***********************************************************************/
  /* Winston logger parameters                                           */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the Winston general
   * logger middleware.
   */

  // log file paths used to set up the logger
  INFO_LOG: path.join(appRoot, 'logs', 'info.log'),
  ERROR_LOG: path.join(appRoot, 'logs', 'error.log'),

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
  LOGS_DIR: path.join(appRoot, 'logs'),
  // morgan logger stream file name
  MORGAN_STREAM_FILE: 'serverLog.log',

  /***********************************************************************/
  /* Database parameters                                                 */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the database.
   * The database is set up in a modular fashion, i.e. it depends only
   * on the parameters below.
   */

  // path to the function that starts the external database server
  get START_DB_SERVICE() {
    return this.EXT_DB_SERVICE;
  },
  /* mongoDB url connection parameters */
  DB_USER: 'syPerformAdmin',
  DB_PASSWORD: 'projectPerform',
  DB_HOST: 'localhost',
  DB_PORT: '27017',
  // database to use on the server
  DB_NAME: 'test',
  AUTH_MECHANISM: 'DEFAULT',
  AUTH_SOURCE: 'admin',
  SSL_ON: 'true',
  /* mongoDB connection options object */
  DB_CA: path.join(appRoot, 'certs', 'rootCA.crt'),
  DB_KEY: path.join(appRoot, 'certs', 'nodeKeyAndCert.pem'),
  DB_CERT: path.join(appRoot, 'certs', 'nodeKeyAndCert.pem'),
  SSL_VALIDATE: true,
  // session store key
  SESSION_KEY: 'session secret key',
  // session store time to live
  SESSION_EXPIRES: 14 * 24 * 60 * 60 * 1000, // 2 weeks
  SESSION_COLLECTION: 'sessions',

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
  EXEC_JS: path.join(appRoot, 'dist', 'index'),
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
    'server',
    'logs',
    'monitorForever.log',
  ),
  // child stdout log
  MONITOR_OUT_LOG: path.join(appRoot, 'logs', 'monitorOut.log'),
  // child stderr log
  MONITOR_ERR_LOG: path.join(appRoot, 'logs', 'monitorErr.log'),
};
