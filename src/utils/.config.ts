/**
 * This module sets all configuration parameters for the
 * utils utilities.
 * It must be stored in the same directory as the logger.ts file.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);



/***********************************************************************/
/* Winston logger parameters                                           */
/***********************************************************************/

/**
 * This section sets all configuration parameters for the Winston general
 * logger.
 */

export const loggerConfig = {
  // log file paths used to set up the logger
  INFO_LOG: '../../logs/nfo.log',
  ERROR_LOG: '../../logs/error.log',
};
