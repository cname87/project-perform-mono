/**
 * Usage:
 *
 * Add...
 * import { DumpError } from '<path to>dumperror';
 * dumpError = new DumpError(config);
 *
 * where 'config' is a javascript object containing required logger
 * configuration parameters - see the 'Winston logger parameters' section in
 * .config.js.
 *
 * This module can be required in the main application module and the
 * dumpError object passed downstream.
 * Also once this module is imported then all subsequent imports get the same
 * object, irrespective of the config parameter passed in.  Thus you can
 * set up DumpError in the main module and add...
 * dumpError = new DumpError(); in other modules,
 * i.e. with no dependency on the configuration file.
 *
 * Note: The property 'dumped' is set to true on an object
 * that is passed in to prevent an error object that has
 * being dumped from being dumped again.
 */
import winston from 'winston';
declare type dumpErrorInstance = (err: IErr) => void;
export declare class DumpError {
  static instance: any;
  static dump: (err: any) => void;
  static getInstance(initialLogger?: winston.Logger): dumpErrorInstance;
  constructor(initialLogger?: winston.Logger);
}
export {};
//# sourceMappingURL=dumperror.d.ts.map
