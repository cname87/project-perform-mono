'use strict';

/**
 * This module provides a Morgan http(s) server logger.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import morgan from 'morgan';
import rfs from 'rotating-file-stream';

/**
 * Usage:
 *
 * Add...
 * import { ServerLogger } from '<path to>serverlogger';
 * serverLogger = new ServerLogger(config);
 *
 * where 'config' is a javascript object containing required configuration
 * parameters - see the 'Morgan logger parameters' section in .config.js.
 *
 * This module can be required in the main application module and the server
 * logger object passed to the Express server module.
 * Also once this module is imported then all subsequent imports get the same
 * object, irrespective of the config parameter passed in.  Thus you can
 * set up the logger in the main module and add...
 * serverLogger = new ServerLogger(); in the server module,
 * i.e. with no dependency on the configuration file.
 *
 * Then in the Express server module...
 * app.use(serverLogger.logConsole); to log 'dev' format to stdout.
 * app.use(serverLogger.logFile); to log detail format to file.
 *
 */

export class ServerLogger {
  public static instance: any;

  constructor(config: any) {
    if (!ServerLogger.instance) {
      ServerLogger.instance = createLogger(config, morgan, rfs);
    }

    return ServerLogger.instance;
  }
}

function createLogger(config: any, morganParam: any, rfsParam: any) {
  debug(modulename + ': running createLogger');

  /* create a rotating write stream for logger*/
  const serverLogStream = rfsParam(config.MORGAN_STREAM_FILE, {
    interval: '1d', // rotate daily
    maxFiles: 7,
    path: config.LOGS_DIR,
    size: '100K', // max size of one log file
  });

  /* allow use req.id in logs */
  morganParam.token('id', function getId(req: any) {
    return req.id;
  });

  /* log 'dev' format to default stdout */
  const logConsole = morganParam('dev', {
    skip: (_req: any, res: any) => {
      return res.statusCode < 0; // set to < 400 to see only errors
    },
  });

  /* log detailed format to log rotated files */
  const logFile = morganParam(config.MORGAN_FORMAT, {
    stream: serverLogStream,
  });

  return {
    logConsole,
    logFile,
  };
}
