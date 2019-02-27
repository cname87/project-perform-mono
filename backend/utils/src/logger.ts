/**
 * This module provides a Winston logger service.
 * It uses the file paths specified in the imported
 * configuration file.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* import configuration file */
import { loggerConfig } from './configUtils';

/* external dependencies */
import * as fs from 'fs';
import * as winston from 'winston';
const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;

/**
 * Usage:
 *
 * Add...
 * import { Logger } from '<path to>logger';
 * logger = Logger.getInstance();
 *
 * Set the log files paths in .config.js (which must be in the same directory as this file).
 *
 * Once this module is imported then all subsequent imports get the same
 * object.
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
const defaultInfoLog = loggerConfig.INFO_LOG;
const defaultErrorLog = loggerConfig.ERROR_LOG;

export class Logger {
  public static instance: winston.Logger;

  public static getInstance(
    infoLog: string = defaultInfoLog,
    errorLog: string = defaultErrorLog,
  ): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(infoLog, errorLog) as winston.Logger;
    }
    return Logger.instance;
  }

  public constructor(infoLog: string, errorLog: string) {
    if (!Logger.instance) {
      Logger.instance = makeLogger(infoLog, errorLog);
    }

    return Logger.instance;
  }
}

function makeLogger(infoFile: string, errorFile: string): winston.Logger {
  debug(modulename + ': running logger');

  /* log paths */
  const arPaths: string[] = [];
  arPaths.push(infoFile, errorFile);

  /* create files if they don't exist */
  for (const file of arPaths) {
    try {
      /* create file and write '' or fail if it exists */
      fs.writeFileSync(file, '', { flag: 'wx' });
    } catch (err) {
      if (err.code === 'EEXIST') {
        /* file exists */
      } else {
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
      format: combine(
        winston.format.colorize({ all: true }),
        label({ label: 'PP' }),
        timestamp(),
        winston.format.align(),
        myFormat,
      ),
      handleExceptions: true,
      json: false,
      level: 'debug',
    },
    errorFile: {
      filename: errorFile,
      format: combine(
        label({ label: 'PP' }),
        timestamp(),
        winston.format.align(),
        myFormat,
      ),
      handleExceptions: true,
      json: true,
      level: 'error',
      maxFiles: 5,
      maxsize: 5242880, // 5MB
    },
    infoFile: {
      filename: infoFile,
      format: combine(
        label({ label: 'PP' }),
        timestamp(),
        winston.format.align(),
        myFormat,
      ),
      handleExceptions: false,
      json: true,
      level: 'info',
      maxFiles: 5,
      maxsize: 5242880, // 5MB
    },
  };

  const loggerObject: winston.Logger = createLogger({
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
