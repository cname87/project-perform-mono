/**
 * This module creates a database model to manage team members'
 * details.
 */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import { Document, DocumentToObjectOptions, Model, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

/* internal dependencies */
import { Database } from './configModels';

/**
 * Creates a Members schema and returns a Mongoose model.
 * @returns A Mongoose model.
 * @param database connection to a mongoDB database.
 */
function createModel(database: Database): Model<Document> {
  debug(modulename + ': running createModel');

  /* set up schema, collection, and model name */
  const memberSchema = new Schema({
    id: { type: Number, unique: true },
    name: String,
  });

  const collection = 'members';
  const ModelName = 'Members';

  /* auto-increment the id field on document creation */
  memberSchema.plugin(autoIncrement, {
    model: 'Members',
    field: 'id',
    startAt: 1,
  });

  /* create the model */
  const model = database.createModel(ModelName, memberSchema, collection);

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
export { createModel as createModelMembers };
