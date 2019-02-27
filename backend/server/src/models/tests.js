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
function createModel(dbConnection, database) {
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
exports.createModel = createModel;
//# sourceMappingURL=tests.js.map