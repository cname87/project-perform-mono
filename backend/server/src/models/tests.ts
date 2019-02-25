/*
 * This module creates a test database model.
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

export function createModel(dbConnection: any, database: any) {
  debug(modulename + ': running createModel');

  /* set up schema, collection, and model name */
  const schema = {
    test1: String,
    test2: String,
  };
  const collection = 'tests';
  const ModelName = 'Tests';

  return database.createModel(ModelName, schema, collection, dbConnection);
}
