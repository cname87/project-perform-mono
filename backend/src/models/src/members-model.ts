/**
 * This module creates a database model to manage team members'
 * details.
 */

import { setupDebug } from '../../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

/* external dependencies */
import { Document, DocumentToObjectOptions, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

/**
 * Creates a Members schema and returns a Mongoose model.
 * @param database - a connection to a mongoDB database.
 * @param ModelName - the name for the created model.
 * @param collection - the name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModelMembers(
  database: Perform.Database,
  ModelName: string,
  collection: string,
): Perform.IModelExtended {
  debug(modulename + ': running createModelMembers');

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
  const ModelMembers = (database.createModel(
    ModelName,
    memberSchema,
    collection,
  ) as any) as Perform.IModelExtended;

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
export { createModelMembers };
