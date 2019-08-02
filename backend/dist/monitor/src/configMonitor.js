"use strict";
/**
 * This section sets all configuration parameters for the monitor
 * module that implements monitoring of an executable using the
 * forever package.
 * The monitor module is self-contained i.e. it is not dependent on
 * anything other than a path to this file, which includes the path
 * to the monitored executable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* external dependencies */
const appRootObject = require("app-root-path");
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
const appRoot = appRootObject.toString();
const path = require("path");
// a configured winston general logger
const logger_1 = require("../../utils/src/logger");
/* a utility to dump errors to the logger */
const dumpError_1 = require("../../utils/src/dumpError");
exports.config = {
    /**
     * This section sets up imports for all the internal modules.
     */
    Logger: logger_1.Logger,
    DumpError: dumpError_1.DumpError,
    /* The path to the executable js file */
    EXEC_JS: path.join(appRoot, process.env.EXEC_JS),
    /* maximum number of child starts triggered by forever */
    MAX_STARTS: 10,
    /* true for forever to restart child when files change /*
    /* *** Not recommended as not well supported *** */
    WATCH_FILES: false,
    /* directory to be watched by forever */
    WATCH_DIR: appRoot,
    /* true for forever to start node executable in debug mode */
    get IS_MONITOR_DEBUG() {
        return process.env.NODE_ENV === 'development' ? true : false;
    },
    /* The logs directory referenced in the various log files
     * must exist. */
    /* forever log when run as a daemon */
    MONITOR_FOREVER_LOG: path.join(appRoot, process.env.LOGS_DIR, 'monitorForever.log'),
    /* child stdout log */
    MONITOR_OUT_LOG: path.join(appRoot, process.env.LOGS_DIR, 'monitorOut.log'),
    /* child stderr log */
    MONITOR_ERR_LOG: path.join(appRoot, process.env.LOGS_DIR, 'monitorErr.log'),
};
//# sourceMappingURL=configMonitor.js.map