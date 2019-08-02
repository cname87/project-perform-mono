"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * This module creates a database model to manage team members'
 * details.
 */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/* external dependencies */
const mongoose_1 = require("mongoose");
const mongoose_plugin_autoinc_1 = require("mongoose-plugin-autoinc");
/**
 * Creates a Members schema and returns a Mongoose model.
 * @param database - a connection to a mongoDB database.
 * @param ModelName - the name for the created model.
 * @param collection - the name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModel(database, ModelName, collection) {
    debug(modulename + ': running createModel');
    /* set up schema, collection, and model name */
    const memberSchema = new mongoose_1.Schema({
        id: { type: Number, unique: true },
        name: String,
    });
    /* auto-increment the id field on document creation */
    /* note: resetCount() is called when delete all members is called */
    memberSchema.plugin(mongoose_plugin_autoinc_1.autoIncrement, {
        model: ModelName,
        field: 'id',
        startAt: 1,
    });
    /* create the model - extended above by autoinc plugin */
    const ModelMembers = database.createModel(ModelName, memberSchema, collection);
    /* set toObject option so _id, and __v deleted */
    ModelMembers.schema.set('toObject', {
        transform: (_doc, ret, _options) => {
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    });
    return ModelMembers;
}
exports.createModelMembers = createModel;
//# sourceMappingURL=members.js.map