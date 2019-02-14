/**
 * This module sets all configuration parameters for the
 * utils utilities.
 * It must be stored in the same directory as the logger.ts file.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import * as appRootObject from 'app-root-path';
const appRoot = appRootObject.toString();
import path from 'path';

/***********************************************************************/
/* Winston logger parameters                                           */
/***********************************************************************/

/**
 * This section sets all configuration parameters for the Winston general
 * logger.
 */

export const loggerConfig = {
  // log file paths used to set up the logger
  INFO_LOG: path.join(appRoot, '/logs/nfo.log'),
  ERROR_LOG: path.join(appRoot, '/logs/error.log'),
};
