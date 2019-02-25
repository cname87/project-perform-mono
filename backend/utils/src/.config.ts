/**
 * This module sets all configuration parameters for the
 * utils utilities.
 * It must be stored in the same directory as the logger.ts file.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import * as path from 'path';

/***********************************************************************/
/* Winston logger parameters                                           */
/***********************************************************************/

/**
 * This section sets all configuration parameters for the Winston general
 * logger.
 */

export const loggerConfig = {
  /* log file paths used to set up the logger */
  /* Provide an absolute path to the logs directory located at /utils/logs.
  Based on the location of the compiled .config.js file i.e. /utils/dist. */
  INFO_LOG: path.resolve('../utils/logs/info.log'),
  ERROR_LOG: path.resolve('../utils/logs/error.log'),
};
