/**
 * This module sets all configuration parameters for the
 * models component.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import { Document, Model } from 'mongoose';

/* database type */
import { Database } from '../../database/src/configDatabase';
export type Database = Database;

export interface IModelExtended extends Model<Document, {}> {
  resetCount: () => void;
  nextCount: () => number;
}
