/**
 * This module sets all configuration parameters for the
 * models component.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* database type */
import { Database } from '../../database/src/configDatabase';
export type Database = Database;
