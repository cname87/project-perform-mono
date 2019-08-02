"use strict";
/**
 * This module sets all configuration parameters for the
 * utils utilities.
 * It must be stored in the same directory as the logger.ts file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
const appRootObject = require("app-root-path");
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
const appRoot = appRootObject.toString();
const path = require("path");
/***********************************************************************/
/* Winston logger parameters                                           */
/***********************************************************************/
/**
 * This section sets all configuration parameters for the Winston general
 * logger.
 */
exports.loggerConfig = {
    /* log file paths used to set up the logger */
    LOGS_DIR: path.join(appRoot, 'logs'),
    INFO_LOG: 'info.log',
    ERROR_LOG: 'error.log',
};
//# sourceMappingURL=configUtils.js.map