/**
 * This module sets all configuration parameters for the
 * utils utilities.
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/***********************************************************************/
/* Types                                                               */
/***********************************************************************/

/* extra fields for created errors */
/* Note that this extends Error: 'name' is mandatory, 'message' is optional */
export interface IErr extends Error {
  /* set true to show that the error has been dumped already */
  dumped?: boolean;
  /* add a http status code on creation, which is later written into the http response */
  statusCode?: number;
}
