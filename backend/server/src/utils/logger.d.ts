import * as winston from 'winston';
/**
 * Usage:
 *
 * Add...
 * import { Logger } from '<path to>logger';
 * logger = Logger.getInstance(config);
 *
 * where 'config' is a javascript object containing required logger
 * configuration parameters - see the 'Winston logger parameters' section in
 * .config.js.
 *
 * This module can be required in the main application module and the
 * logger object passed downstream.
 * Also once this module is imported then all subsequent imports get the same
 * object, irrespective of the config parameter passed in.  Thus you can
 * set up Logger in the main module and add...
 * logger = Logger.getInstance(); in other modules,
 * i.e. with no dependency on the configuration file.
 *
 * Then...
 * Use logger.info('text') to log 'text' to the info file,
 * and to console.log if not in production.
 * Use logger.error('text') to log 'text' to the info and error file,
 * and to console.log if not in production.
 *
 * format is <timestamp> [PP] <info/error> <message>
 */
export declare class Logger {
  static instance: any;
  static getInstance(config: IConfig): winston.Logger;
  constructor(config?: IConfig);
}
//# sourceMappingURL=logger.d.ts.map
