'use strict';
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

/* external dependencies */
import winston from 'winston';

type dumpErrorInstance = (err: IErr) => void;

export class DumpError {
  public static instance: any;
  public static dump: (err: any) => void;
  public static getInstance(initialLogger?: winston.Logger): dumpErrorInstance {
    if (!DumpError.instance && initialLogger) {
      DumpError.instance = new DumpError(initialLogger);
    }
    return DumpError.instance;
  }

  public constructor(initialLogger?: winston.Logger) {
    if (!DumpError.instance && initialLogger) {
      DumpError.dump = initialLogger.error;
      DumpError.instance = dumpError;
    }

    return DumpError.instance;
  }
}

function dumpError(err: IErr) {
  debug(modulename + ': running dumpError');

  if (err && typeof err === 'object') {
    if (err.dumped) {
      debug(modulename + ': error already dumped');
      return;
    }

    if (err.message) {
      DumpError.dump('Error Message: \n' + err.message + '\n');
    } else {
      /* if no message property just dump the object */
      DumpError.dump(err);
    }

    if (err.status) {
      DumpError.dump('Error Status: \n' + err.status + '\n');
    }

    if (err.code) {
      DumpError.dump('Error Code: \n' + err.code + '\n');
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
