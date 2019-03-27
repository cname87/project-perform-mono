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
import * as LOGGER from '../../utils/src/logger';
// a utility to dump errors to the logger
import * as DUMPERROR from '../../utils/src/dumpError';
// database files
import * as DATABASE from '../../database/src/index';

/* list of controllers */
import * as FAIL_CONTROLLER from './controllers/fail';

/* list of handlers */
import * as MEMBERS_HANDLER from './handlers/members';

/* list of models */
import * as USERS_MODEL from '../../models/src/users';
import * as TESTS_MODEL from '../../models/src/tests';
import * as MEMBERS_MODEL from '../../models/src/members';

export interface IConfig {
  readonly LOGGER: {
    Logger: typeof LOGGER.Logger;
  };
  readonly DUMPERROR: {
    DumpError: typeof DUMPERROR.DumpError;
  };
  readonly MEMBERS_HANDLER: {
    addMember: typeof MEMBERS_HANDLER.addMember;
    deleteMember: typeof MEMBERS_HANDLER.deleteMember;
    getMember: typeof MEMBERS_HANDLER.getMember;
    getMembers: typeof MEMBERS_HANDLER.getMembers;
    updateMember: typeof MEMBERS_HANDLER.updateMember;
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
  FAIL_CONTROLLER,
  MEMBERS_HANDLER,
  USERS_MODEL,
  TESTS_MODEL,
  MEMBERS_MODEL,

  /***********************************************************************/
  /* Misc application parameters                                         */
  /***********************************************************************/

  /**
   * This section sets misc configuration parameters used by the
   * application programme.
   */

  /* ok to start server if database fails to start? */
  ENV_FILE: path.join(appRoot, '.env'),
  IS_NO_DB_OK: false,

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
  // path to the views directory
  PATH_VIEWS: path.join(appRoot, 'server', 'src', 'views'),
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
  /* Swagger api configuration                                       */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for swagger-tools.
   */
  API_FILE: path.join(appRoot, 'api', 'swagger.json'),
  CONTROLLERS_PATH: path.join(
    appRoot,
    'dist',
    'server',
    'src',
    'controllers',
    'api',
  ),
};

import * as express from 'express';

export interface IAppLocals {
  app: express.Application;
}
