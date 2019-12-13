/**
 * This module provides a Winston logger service.
 * It logs only to the GCP Winston logging service and to console.
 */

import { setupDebug } from './debugOutput';
const { modulename, debug } = setupDebug(__filename);

import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
const { createLogger, format, transports } = winston;
const { align, colorize, combine, timestamp, label, printf, splat } = format;

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
      error: 'bold red',
      info: 'underline yellow',
      debug: 'green',
    },
    levels: {
      error: 0,
      info: 1,
      debug: 2,
    },
  };
  winston.addColors(myLevels.colors);

  /* set GCP logging level to 'debug' if any debug logging is active, otherwise set to 'error' */
  const productionLevel = process.env.DEBUG ? 'debug' : 'error';
  /* only output console in color for development (vscode) environment */
  const outputInColor = process.env.NODE_ENV === 'development';

  const options = {
    console: {
      format: combine(
        colorize({ all: outputInColor }),
        timestamp(),
        label({ label: 'PP' }), // set the label used in the output
        align(), // adds a \t delimiter before the message to align it
        splat(),
        myFormat,
      ),
      handleExceptions: true,
      json: false,
      level: 'debug',
    },
    stackDriver: {
      format: combine(
        timestamp(),
        label({ label: 'PP' }),
        align(),
        splat(),
        myFormat,
      ),
      handleExceptions: true, // will catch and log uncaughtException events
      json: false,
      level: productionLevel, // GCP logging level
    },
  };

  const loggerObject = createLogger({
    levels: myLevels.levels, // custom levels
    transports: [],
    exitOnError: true, // default -exit after an uncaughtException
  });

  /* if running from GCP then add GCP Stackdriver Logging */
  if (process.env.GAE_ENV) {
    /* logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log" */
    loggerObject.add(new LoggingWinston(options.stackDriver));
  } else {
    /* if not production environment send to stdout */
    loggerObject.add(new transports.Console(options.console));
  }

  const logger: winston.Logger = Object.create(loggerObject);

  // logger.on('finish', function (_info) {
  //   /* could trap an event when all messages have been logged */
  // });

  return logger;
}

/* export Logger class */
export { Logger };
