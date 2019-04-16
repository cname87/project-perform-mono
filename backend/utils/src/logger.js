"use strict";
/**
 * This module provides a Winston logger service.
 * It uses the file paths specified in the imported
 * configuration file.
 * The logs directory must exist but the files are created if they do not exist.
 */
exports.__esModule = true;
var modulename = __filename.slice(__filename.lastIndexOf('\\'));
var debug_1 = require("debug");
var debug = debug_1["default"]('PP_' + modulename);
debug("Starting " + modulename);
/* external dependencies */
var fs = require("fs");
var path = require("path");
var winston = require("winston");
var createLogger = winston.createLogger, format = winston.format, transports = winston.transports;
var combine = format.combine, timestamp = format.timestamp, label = format.label, printf = format.printf;
/* import configuration file */
var configUtils_1 = require("./configUtils");
/**
 * Usage:
 *
 * A config file is imported that contains all configuration infomation:
 * - The logs directory, which must exist.
 * - The log files paths.
 *
 * In the module requiring a logger service add...
 * import { Logger } from '<path to><this file>';
 * logger = new Logger as winston.Logger;
 *
 * Note: This service proides a singleton logger i.e. all imports get the same
 * Logger class object.
 *
 * Then...
 * Use logger.info('text') to log 'text' to the info file,
 * and to console.log if not in production.
 * Use logger.error('text') to log 'text' to the info and error file,
 * and to console.log if not in production.
 *
 * format is <timestamp> [PP] <info/error> <message>
 */
/* log file paths */
var defaultInfoLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, configUtils_1.loggerConfig.INFO_LOG);
var defaultErrorLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, configUtils_1.loggerConfig.ERROR_LOG);
var Logger = /** @class */ (function () {
    function Logger(infoLog, errorLog) {
        if (infoLog === void 0) { infoLog = defaultInfoLog; }
        if (errorLog === void 0) { errorLog = defaultErrorLog; }
        if (!Logger.instance) {
            Logger.instance = makeLogger(infoLog, errorLog);
        }
        return Logger.instance;
    }
    return Logger;
}());
exports.Logger = Logger;
function makeLogger(infoFile, errorFile) {
    debug(modulename + ': running logger');
    /* log paths */
    var arPaths = [];
    arPaths.push(infoFile, errorFile);
    /* create files if they don't exist */
    for (var _i = 0, arPaths_1 = arPaths; _i < arPaths_1.length; _i++) {
        var file = arPaths_1[_i];
        try {
            /* create file and write '' or fail if it exists */
            fs.writeFileSync(file, '', { flag: 'wx' });
        }
        catch (err) {
            if (err.code === 'EEXIST') {
                /* file exists */
            }
            else {
                /* unexpected error */
                throw err;
            }
        }
    }
    var myFormat = printf(function (info) {
        return info.timestamp + " [" + info.label + "] " + info.level + ": " + info.message;
    });
    var myLevels = {
        colors: {
            debug: 'green',
            error: 'bold red',
            info: 'underline yellow'
        },
        levels: {
            debug: 2,
            error: 0,
            info: 1
        }
    };
    winston.addColors(myLevels.colors);
    var options = {
        console: {
            format: combine(winston.format.colorize({ all: true }), label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: true,
            json: false,
            level: 'debug'
        },
        errorFile: {
            filename: errorFile,
            format: combine(label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: true,
            json: true,
            level: 'error',
            maxFiles: 5,
            maxsize: 5242880
        },
        infoFile: {
            filename: infoFile,
            format: combine(label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: false,
            json: true,
            level: 'info',
            maxFiles: 5,
            maxsize: 5242880
        }
    };
    var loggerObject = createLogger({
        levels: myLevels.levels,
        transports: [
            new transports.File(options.errorFile),
            new transports.File(options.infoFile),
        ]
    });
    /* add console.log only if development environment */
    /* using config setting which sets environment in runServer */
    if (process.env.NODE_ENV !== 'production') {
        loggerObject.add(new transports.Console(options.console));
    }
    var logger = Object.create(loggerObject);
    return logger;
}
