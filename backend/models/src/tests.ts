/*
 * This module creates a test database model.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

import { Document, Model, SchemaDefinition } from 'mongoose';
import { Database } from './configModels';

export function createModel(database: Database): Model<Document> {
  debug(modulename + ': running createModel');

  /* set up schema, collection, and model name */
  const schema: SchemaDefinition = {
    test1: String,
    test2: String,
  };
  const collection = 'tests';
  const ModelName = 'Tests';

  return database.createModel(ModelName, schema, collection);
}
