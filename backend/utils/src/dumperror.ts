/**
 * This module provides a error logging service.
 * It uses the winston logger utility.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/**
 * Usage:
 *
 * Add...
 * const { DumpError } = <path to file>.dumpError;
 * const dumpError = DumpError.getInstance(logger);
 *
 * where 'logger' is optional.
 * - Use a winston logger with a logger.error function.
 * - If blank then console will be passed to use console.error.
 *
 * Also once this module is imported then all subsequent imports get the same
 * object, irrespective of the logger parameter passed in.  Thus you can
 * set up DumpError in the main module and add...
 * dumpError = DumpError.getInstance(); in other modules,
 *
 * Note: The property 'dumped' is set to true on an object
 * that is passed in to prevent an error object that has
 * being dumped from being dumped again.
 */

/* external dependencies */

/**
 * Import local types.
 */
import { IErr } from './configUtils';
import { Logger } from './logger';

type typeDumpErrorInstance = (err: IErr | string) => void;

class DumpError {
  /* holds the singleton instance */
  public static instance: typeDumpErrorInstance;

  /* the function that dumps the error - logger.error or console.error */
  public static dump: (err: any) => void;

  /* creates new instance if one does not exist */
  public static getInstance(initialLogger?: Logger): typeDumpErrorInstance {
    if (!DumpError.instance) {
      DumpError.instance = new DumpError(
        initialLogger,
      ) as typeDumpErrorInstance;
    }
    return DumpError.instance;
  }

  /* instantiates if necessary and sets dump to logger.error or console.error */
  public constructor(initialLogger?: any) {
    // replace any ***********
    if (!DumpError.instance) {
      DumpError.dump = initialLogger
        ? initialLogger.error.bind(initialLogger)
        : console.error;
      DumpError.instance = dumpError;
    }
    return DumpError.instance;
  }
}

function dumpError(err: IErr | string) {
  debug(modulename + ': running dumpError');

  if (err && typeof err === 'object') {
    if (err.dumped) {
      debug(modulename + ': error already dumped');
      return;
    }

    if (err.name) {
      DumpError.dump('Error Name: \n' + err.name + '\n');
    }

    if (err.message) {
      DumpError.dump('Error Message: \n' + err.message + '\n');
    } else {
      /* if no message property just dump the object */
      DumpError.dump(err.toString());
    }

    if (err.statusCode) {
      DumpError.dump('Error HTTP Status Code: \n' + err.statusCode + '\n');
    }

    if (err.stack) {
      DumpError.dump('Error Stacktrace: \n' + err.stack + '\n');
    }

    /* mark so not dumped twice */
    err.dumped = true;
  } else if (typeof err === 'string') {
    DumpError.dump('Error String: ' + err);
  } else {
    DumpError.dump('DumpError: err is null or not an object or string');
  }
}

/* export DumpError class and type of an instance of the class */
export { DumpError, typeDumpErrorInstance };
