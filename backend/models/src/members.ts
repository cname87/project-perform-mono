/**
 * This module creates a database model to manage team members'
 * details.
 */
import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import { Document, DocumentToObjectOptions, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

/* internal dependencies */
import { Database, IModelExtended } from './configModels';

/**
 * Creates a Members schema and returns a Mongoose model.
 * @param database - a connection to a mongoDB database.
 * @param ModelName - the name for the created model.
 * @param collection - the name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModel(
  database: Database,
  ModelName: string,
  collection: string,
): IModelExtended {
  debug(modulename + ': running createModel');

  /* set up schema, collection, and model name */
  const memberSchema = new Schema({
    id: { type: Number, unique: true },
    name: String,
  });

  /* auto-increment the id field on document creation */
  /* note: resetCount() is called when delete all members is called */
  memberSchema.plugin(autoIncrement, {
    model: ModelName,
    field: 'id',
    startAt: 1,
  });

  /* create the model - extended above by autoinc plugin */
  const ModelMembers = database.createModel(
    ModelName,
    memberSchema,
    collection,
  ) as IModelExtended;

  /* set toObject option so _id, and __v deleted */
  ModelMembers.schema.set('toObject', {
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

  return ModelMembers;
}

/* export the model creation function */
export { createModel as createModelMembers };
