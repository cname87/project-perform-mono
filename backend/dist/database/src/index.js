"use strict";
/**
 * This module exports a function that connects to an online MongoDB database.
 * See function detail below.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* import configuration parameters into process.env first */
/* the .env file must be in process.cwd() */
const dotenv = require("dotenv");
dotenv.config();
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
exports.debug = debug_1.default(`PP_${modulename}`);
exports.debug(`Starting ${modulename}`);
/* import configuration file */
const configDatabase_1 = require("./configDatabase");
/**
 * This function connects to a MongoDB online database.
 * The database connection returned is either a test or production database depending on an env parameter, as set in the config database file.
 *
 * @returns The function returns a Database instance.
 *
 * The database instance includes...
 * A promise to an established connection to a database on a MongoDB server.
 * Utility database methods.
 * See database module for database instance detail.
 *
 * @throws Throws an error if the database set up fails.
 */
async function runDatabaseApp() {
    exports.debug(modulename + ': running runDatabaseApp');
    /* create the single instance of the general logger and dumpError utility */
    const Logger = configDatabase_1.filepaths.Logger;
    const logger = new Logger();
    const DumpError = configDatabase_1.filepaths.DumpError;
    const dumpError = new DumpError(logger);
    logger.info('\n*** CONNECTING TO THE DATABASE ***\n');
    try {
        const connectionUrl = configDatabase_1.getMongoUri();
        const connectOptions = configDatabase_1.getConnectionOptions();
        const database = new configDatabase_1.filepaths.Database(connectionUrl, connectOptions, logger, dumpError);
        /* must await database connection from promise */
        database.dbConnection = await database.dbConnectionPromise;
        /* return database instance */
        return database;
    }
    catch (err) {
        logger.error(modulename + ': database failed to setup');
        dumpError(err);
        throw err;
    }
}
exports.runDatabaseApp = runDatabaseApp;
//# sourceMappingURL=index.js.map