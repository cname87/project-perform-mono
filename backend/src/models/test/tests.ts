/**
 * This module creates a test database model.
 */

import { setupDebug } from '../../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

import { Document, DocumentToObjectOptions, Model, Schema } from 'mongoose';

function createModel(database: Perform.Database): Model<Document> {
  debug(modulename + ': running createModel');

  /* set up schema, collection, and model name */
  const schema = new Schema({
    id: { type: Number, unique: true },
    name: String,
  });

  const collection = 'tests';
  const ModelName = 'Tests';

  /* create the model */
  const model = database.createModel(ModelName, schema, collection);

  /* set toObject option so _id, and __v deleted */
  model.schema.set('toObject', {
    transform: (
      _doc: Document,
      ret: any,
      _options: DocumentToObjectOptions,
    ) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  return model;
}

/* export the model creation function */
export { createModel as createModelTests };
