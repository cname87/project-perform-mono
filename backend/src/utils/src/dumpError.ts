/**
 * This module provides a error logging service.
 * It uses the winston logger utility.
 */

/**
 * Usage:
 *
 * Add...
 * const { DumpError } = <path to file>.dumpError;
 * const dumpError = new DumpError(logger) as (err: any) => void;
 *
 * where 'logger' is optional.
 * - Use a winston logger with a logger.error function.
 * - If blank then console will be passed to use console.error.
 *
 * Also once this module is imported then all subsequent imports get the same
 * object, irrespective of the logger parameter passed in.  Thus you can
 * set up DumpError in the main module and add...
 * dumpError = new DumpError(); in other modules,
 *
 * Note: The property 'dumped' is set to true on an object
 * that is passed in to prevent an error object that has
 * being dumped from being dumped again.
 */

/* external dependencies */
import winston from 'winston';
import util from 'util';
import { setupDebug } from './debugOutput';

const { modulename } = setupDebug(__filename);

class DumpError {
  /* holds the singleton instance */
  public static instance: Perform.DumpErrorFunction;

  /* the function that dumps the error - logger.error or console.error */
  public static dump: Perform.DumpErrorFunction;

  /* instantiates if necessary and sets dump to logger.error or console.error */
  public constructor(initialLogger?: winston.Logger) {
    if (!DumpError.instance) {
      DumpError.dump = initialLogger
        ? initialLogger.error.bind(initialLogger)
        : console.error;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      DumpError.instance = dumpError;
    }
    return DumpError.instance;
  }
}

function dumpError(err: any) {
  DumpError.dump(`${modulename}: dumpError called`);

  if (err && typeof err === 'object') {
    if (err.dumped) {
      DumpError.dump(`${modulename}: error previously dumped`);
      return;
    }

    DumpError.dump(`Error Object: \n${util.format('%O', err)}\n`);

    /* mark so not dumped twice */
    err.dumped = true;
  } else if (typeof err === 'string') {
    DumpError.dump(`Error String: ${err}`);
  } else {
    DumpError.dump('DumpError: err is null or not an object or string');
  }
}

export { DumpError };
