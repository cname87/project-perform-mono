/**
 * Utility that exports a function that...
 * - takes the __filename property of a module and outputs some information (using the debug package).
 * - returns the name of the module file and a debug function with the prefix set up - used by the calling module to output debug information to stdout.
 */

import { sep } from 'path';
import debugFunction from 'debug';

export const setupDebug = (filename: string) => {
  const modulename = filename.slice(filename.lastIndexOf(sep));
  const debug = debugFunction(`PP_${modulename}`);
  debug.log = console.log.bind(console);
  debug(`Starting${modulename}`);
  return { modulename, debug };
};

setupDebug(__filename);
