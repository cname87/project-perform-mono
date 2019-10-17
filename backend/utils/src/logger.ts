/**
 * This module provides a Winston logger service.
 * It logs only to the GCP Winston logging service and to console.
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import winston = require('winston');
import { LoggingWinston } from '@google-cloud/logging-winston';
const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;

/**
 * Usage:
 *
 * In the module requiring a logger service add...
 * import { Logger } from '<path to><this file>';
 * logger = new Logger as winston.Logger;
 *
 * Note: This service proides a singleton logger i.e. all imports get the same
 * Logger class object.
 *
 * Then...
 * Use logger.info('text') to log 'text' at the 'info' level and use logger.error('text') to log 'text' at.the 'error' level.
 *
 * The output goes to the GCP logging service if in production and to the console if not in production.
 *
 * The production logging level is set by the .env parameter 'DEBUG' which also controls logging to the 'debug' logger.  The console logging level is always 'debug', both 'info' and 'error' messages are always logged.
 *
 * format is <timestamp> [PP] <info/error> <message>
 */

class Logger {
  public static instance: winston.Logger;

  public constructor() {
    if (!Logger.instance) {
      Logger.instance = makeLogger();
    }

    return Logger.instance;
  }
}

function makeLogger(): winston.Logger {
  debug(modulename + ': running makeLogger');

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

  /* set GCP logging level to 'debug' if any debug logging is active, otherwise set to 'error' */
  const productionLevel = process.env.DEBUG ? 'debug' : 'error';

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
    stackDriver: {
      format: combine(
        label({ label: 'PP' }),
        timestamp(),
        winston.format.align(),
        myFormat,
      ),
      handleExceptions: true,
      json: false,
      level: productionLevel, // GCP logging level
    },
  };

  const loggerObject = createLogger({
    levels: myLevels.levels,
    transports: [],
  });

  if (process.env.NODE_ENV === 'production') {
    /* if production environment add GCP Stackdriver Logging */
    /* logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log" */
    loggerObject.add(new LoggingWinston(options.stackDriver));
  } else {
    /* if not production environment send to console */
    loggerObject.add(new transports.Console(options.console));
  }

  const logger: winston.Logger = Object.create(loggerObject);
  return logger;
}

/* export Logger class */
export { Logger };
