"use strict";
/**
 * This module sets all configuration parameters for the server application.
 * It also exports all file paths so making changes is easy.
 * It also exports all types used throughout the application.
 * It is imported by index.ts, which passes on all paths and parameters.
 * It is also imported by all other modules to import types only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
const appRootObject = require("app-root-path");
const path = require("path");
const appRoot = appRootObject.toString();
/* import all required modules */
/* server class and functions */
const serverOps_1 = require("./server/serverOps");
const startserver_1 = require("./server/startserver");
const runServer_1 = require("./server/runServer");
/* a configured morgan http(s) server logger */
const serverlogger_1 = require("./server/serverlogger");
// a configured winston general logger
const logger_1 = require("../../utils/src/logger");
/* a utility to dump errors to the logger */
const dumpError_1 = require("../../utils/src/dumpError");
/* access to debug logger for mocha - must be imported this way */
const ERROR_HANDLERS = tslib_1.__importStar(require("./handlers/errorhandler"));
/* error handler middleware functions */
const errorHandlers = ERROR_HANDLERS.errorHandlers;
/* database class and creation function */
const index_1 = require("../../database/src/index");
/* models */
const tests_1 = require("../../models/src/tests");
const members_1 = require("../../models/src/members");
/* controllers */
const api_1 = require("./controllers/api");
const fail_1 = require("./controllers/fail");
/* handlers for /members api */
const membersApi_1 = require("./handlers/api/membersApi");
/* 2nd level members handlers */
const membersHandlers = tslib_1.__importStar(require("./handlers/membersHandlers"));
// shared request handler functions
const miscHandlers_1 = require("./handlers/miscHandlers");
// tslint:disable:object-literal-sort-keys
exports.config = {
    /***********************************************************************/
    /* Internal imports                                                    */
    /***********************************************************************/
    /**
     * This section sets up imports for all the internal modules.
     */
    Server: serverOps_1.Server,
    startServer: startserver_1.startServer,
    runServer: runServer_1.runServer,
    ServerLogger: serverlogger_1.ServerLogger,
    Logger: logger_1.Logger,
    DumpError: dumpError_1.DumpError,
    ERROR_HANDLERS,
    errorHandlers,
    runDatabaseApp: index_1.runDatabaseApp,
    createModelTests: tests_1.createModelTests,
    createModelMembers: members_1.createModelMembers,
    apiController: api_1.apiController,
    failController: fail_1.failController,
    membersApi: membersApi_1.membersApi,
    membersHandlers,
    miscHandlers: miscHandlers_1.miscHandlers,
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
    MORGAN_FORMAT: ':id :remote-addr [:date[clf]]' +
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
//# sourceMappingURL=configServer.js.map