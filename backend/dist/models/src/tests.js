"use strict";
/*
 * This module creates a test database model.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
const mongoose_1 = require("mongoose");
function createModel(database) {
    debug(modulename + ': running createModel');
    /* set up schema, collection, and model name */
    const schema = new mongoose_1.Schema({
        id: { type: Number, unique: true },
        name: String,
    });
    const collection = 'tests';
    const ModelName = 'Tests';
    /* create the model */
    const model = database.createModel(ModelName, schema, collection);
    /* set toObject option so _id, and __v deleted */
    model.schema.set('toObject', {
        transform: (_doc, ret, _options) => {
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    });
    return model;
}
exports.createModelTests = createModel;
//# sourceMappingURL=tests.js.map