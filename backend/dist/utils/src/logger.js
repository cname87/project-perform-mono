"use strict";
/**
 * This module provides a Winston logger service.
 * It uses the file paths specified in the imported
 * configuration file.
 * The logs directory must exist but the files are created if they do not exist.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* external dependencies */
const fs = require("fs");
const path = require("path");
const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;
/* import configuration file */
const configUtils_1 = require("./configUtils");
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
const defaultInfoLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, configUtils_1.loggerConfig.INFO_LOG);
const defaultErrorLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, configUtils_1.loggerConfig.ERROR_LOG);
class Logger {
    constructor(infoLog = defaultInfoLog, errorLog = defaultErrorLog) {
        if (!Logger.instance) {
            Logger.instance = makeLogger(infoLog, errorLog);
        }
        return Logger.instance;
    }
}
exports.Logger = Logger;
function makeLogger(infoFile, errorFile) {
    debug(modulename + ': running logger');
    /* log paths */
    const arPaths = [];
    arPaths.push(infoFile, errorFile);
    /* create files if they don't exist */
    for (const file of arPaths) {
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
    const myFormat = printf((info) => {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    });
    const myLevels = {
        colors: {
            debug: 'green',
            error: 'bold red',
            info: 'underline yellow',
        },
        levels: {
            debug: 2,
            error: 0,
            info: 1,
        },
    };
    winston.addColors(myLevels.colors);
    const options = {
        console: {
            format: combine(winston.format.colorize({ all: true }), label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: true,
            json: false,
            level: 'debug',
        },
        errorFile: {
            filename: errorFile,
            format: combine(label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: true,
            json: true,
            level: 'error',
            maxFiles: 5,
            maxsize: 5242880,
        },
        infoFile: {
            filename: infoFile,
            format: combine(label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: false,
            json: true,
            level: 'info',
            maxFiles: 5,
            maxsize: 5242880,
        },
    };
    const loggerObject = createLogger({
        levels: myLevels.levels,
        transports: [
            new transports.File(options.errorFile),
            new transports.File(options.infoFile),
        ],
    });
    /* add console.log only if development environment */
    /* using config setting which sets environment in runServer */
    if (process.env.NODE_ENV !== 'production') {
        loggerObject.add(new transports.Console(options.console));
    }
    const logger = Object.create(loggerObject);
    return logger;
}
//# sourceMappingURL=logger.js.map