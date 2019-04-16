"use strict";
/**
 * This module sets all configuration parameters for the
 * utils utilities.
 * It must be stored in the same directory as the logger.ts file.
 */
exports.__esModule = true;
var modulename = __filename.slice(__filename.lastIndexOf('\\'));
var debug_1 = require("debug");
var debug = debug_1["default"]('PP_' + modulename);
debug("Starting " + modulename);
var appRootObject = require("app-root-path");
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
var appRoot = appRootObject.toString();
var path = require("path");
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
    ERROR_LOG: 'error.log'
};
