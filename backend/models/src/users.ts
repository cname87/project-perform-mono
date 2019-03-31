/*
 * This module creates a database model to manage users'
 * details.
 */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

import { Document, Model, SchemaDefinition } from 'mongoose';
import { Database } from '../../database/src/configDatabase';

function createModel(database: Database): Model<Document> {
  debug(modulename + ': running createModel');

  /* set up user schema, collection, and model name */
  const schema: SchemaDefinition = {
    username: String,
    // tslint:disable-next-line:object-literal-sort-keys
    email: String,
  };
  const collection = 'users';
  const ModelName = 'Users';

  return database.createModel(ModelName, schema, collection);
}

/* export the model creation function */
export { createModel as createModelUsers };
