'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * This module creates a database model to manage users'
 * details.
 */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
function createModel(dbConnection, database) {
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
exports.createModel = createModel;
//# sourceMappingURL=users.js.map