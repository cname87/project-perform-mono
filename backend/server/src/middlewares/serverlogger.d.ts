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
export declare class ServerLogger {
  static instance: any;
  constructor(config: any);
}
//# sourceMappingURL=serverlogger.d.ts.map
