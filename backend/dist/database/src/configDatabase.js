"use strict";
/**
 * This module sets all configuration parameters for the
 * database component.
 *
 * It must be stored alongside the database index.js file as it is called from index.js using a relative path.
 *
 * Their are 4 configuration items:
 * - filepaths - module file paths.
 * - internal module types (dumpError) needed by other modules.
 * - getMongoUrl() - returns database connection uri.
 * - getConnectionOptions - returns database connection options object.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* external dependencies */
const appRootObject = require("app-root-path");
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
const appRoot = appRootObject.toString();
const path = require("path");
const util_1 = require("util");
/**
 * The filepaths configuration object.
 *
 * This object stores all internal module objects used throughout the database component.  It allows for easy file location changes.
 *
 * Note that module paths are relative to the location of this file and that translates to the compiled dist file.
 * The path to the .env file is absolute (as this is not created in the /dist directtory during compilation).
 *
 * NOTE:  If the relative location of any referenced file changes then the relative path must be updated below.
 */
/* a utility to dump errors to the logger */
const dumpError_1 = require("../../utils/src/dumpError");
/* a configured winston general logger */
const logger_1 = require("../../utils/src/logger");
/* the Database class */
const database_1 = require("./database");
exports.filepaths = {
    Database: database_1.Database,
    DumpError: dumpError_1.DumpError,
    Logger: logger_1.Logger,
};
/**
 * This method returns the uri parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
function getMongoUri() {
    /* mongoDB server connection url and connect options */
    const scheme = 'mongodb+srv';
    const user = encodeURIComponent(process.env.DB_USER);
    const password = encodeURIComponent(process.env.DB_PASSWORD);
    const host = process.env.DB_HOST;
    /* the mongoDB database is either a test database or a production database */
    const db = process.env.DB_MODE === 'production'
        ? process.env.DB_DATABASE
        : process.env.DB_DATABASE_TEST;
    debug(modulename + ` : database ${db} in use`);
    const ssl = 'true';
    const authSource = 'admin';
    const authMechanism = 'DEFAULT';
    return util_1.format('%s://%s:%s@%s/%s?ssl=%s&authSource=%s&authMechanism=%s', scheme, user, password, host, db, ssl, authSource, authMechanism);
}
exports.getMongoUri = getMongoUri;
/**
 * This method returns the options parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
function getConnectionOptions() {
    return {
        /* if not connected, return errors immediately */
        bufferMaxEntries: 0,
        /* prevent mongoose deprecation warnings */
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
    };
}
exports.getConnectionOptions = getConnectionOptions;
/* path to database index.js file for unit test */
exports.indexPath = path.join(appRoot, 'dist', 'database', 'src', 'index');
//# sourceMappingURL=configDatabase.js.map