'use strict';

/*
 * This module creates a database model to manage users'
 * details.
 */
const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

export function createModel(dbConnection: any, database: any) {
  debug(modulename + ': running createModel');

  /* set up user schema, collection, and model name */
  const schema = {
    username: String,
    // tslint:disable-next-line:object-literal-sort-keys
    email: String,
  };
  const collection = 'users';
  const ModelName = 'Users';

  return database.createModel(ModelName, schema, collection, dbConnection);
}
