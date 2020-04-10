/**
 * This module provides a Winston logger service.
 * It logs only to the GCP Winston logging service and to console.
 */

import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { setupDebug } from './debugOutput';

const { modulename, debug } = setupDebug(__filename);
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

function makeLogger(): winston.Logger {
  debug(`${modulename}: running makeLogger`);

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
      level: 'debug', // always 'debug' level for development environment
    },
  };

  const loggerObject = createLogger({
    level: productionLevel, // sets level for the GCP logs
    levels: myLevels.levels, // custom levels
    transports: [],
    exitOnError: true, // default -exit after an uncaughtException
  });

  /* logger for GCP stackdriver */
  const loggingWinston = new LoggingWinston();

  /* if running from GCP then add GCP Stackdriver Logging */
  if (process.env.GAE_ENV) {
    /* logs will be visible on GCP stackdriver logs viewer page */
    loggerObject.add(loggingWinston);
  } else {
    /* if not production environment send to stdout */
    loggerObject.add(new transports.Console(options.console));
    /* to add stackdriver for test then define GOOGLE_APPLICATION_CREDENTIAL and logs will be written to 'global' on the logs viewer page */
    // loggerObject.add(loggingWinston);
  }

  const logger: winston.Logger = Object.create(loggerObject);

  // logger.on('finish', function (_info) {
  //   /* could trap an event when all messages have been logged */
  // });

  return logger;
}

class Logger {
  public static instance: winston.Logger;

  public constructor() {
    if (!Logger.instance) {
      Logger.instance = makeLogger();
    }

    return Logger.instance;
  }
}

/* export Logger class */
export { Logger };
