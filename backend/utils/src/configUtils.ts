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
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
const appRoot = appRootObject.toString();
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
  INFO_LOG: path.join(appRoot, 'logs', 'info.log'),
  ERROR_LOG: path.join(appRoot, 'logs', 'error.log'),
};

/***********************************************************************/
/* Types                                                               */
/***********************************************************************/

/* extra fields for created errors */
/* Error: 'name' is mandatory, 'message' is optional */
export interface IErr extends Error {
  /* set true to show that the error has been dumped already */
  dumped?: boolean;
  /* add a http status code on creation, which is later written into the http response */
  statusCode?: number;
}
