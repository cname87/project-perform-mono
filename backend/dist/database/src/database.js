"use strict";
/**
 * This module returns a database object with a database connection promise and methods to carry out database operations.
 *
 * The database connection is to a MongoDB server.
 *
 * The database object is instantiated with the following parameters:
 * - mongoose.createConnection uri and options parameters.
 * - options Logger and dumpError parameters.
 *
 * The database object provides the following properties:
 * - dbConnectionPromise - a promise that resolves to a mongoose connection object.
 * - dbConnection: null - used to store dbConnection when externally resolved from dBConnectionPromise.
 *
 * The database object provides the following methods:
 * - closeConnection: Closes a supplied connection to the MongoDB server.
 * - createModel: Returns a mongoose model based on supplied parameters.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/* external type dependencies */
const mongoose = require("mongoose");
const mongoose_1 = require("mongoose");
/**
 * The class constructor for the exported database object.
 */
class Database {
    constructor(connectionUrl, connectionOptions, logger = (console = console), dumpError = console.error) {
        this.connectionUrl = connectionUrl;
        this.connectionOptions = connectionOptions;
        this.logger = logger;
        this.dumpError = dumpError;
        /* dbConnection stores dummy until external resolves dbConnection promise and stores in dbConnection */
        this.dummyConnection = {};
        this.closeConnection = closeConnection;
        this.createModel = createModel;
        this.dbConnection = this.dummyConnection;
        this.dbConnectionPromise = connectToDB(connectionUrl, connectionOptions, logger, dumpError);
    }
}
exports.Database = Database;
/**
 * Creates a connection to a database on the MongoDB server.
 * If debug is enabled it also prints stats (to debug) on the configured
 * database.
 * @params
 * - uri: mongoose connection uri.
 * - options: mongoose connection options.
 * - logger: logger function.
 * - dumpError: dumpError function.
 * @returns Returns a promise to a Mongoose database connection object.
 * @throws Throws an error if the connection attempt fails.
 */
async function connectToDB(uri, options, logger, dumpError) {
    debug(modulename + ': running connectToDB');
    try {
        const dbConnection = await mongoose.createConnection(uri, options);
        /* for all models => disable mongoose buffering option */
        mongoose.set('bufferCommands', false);
        debug(modulename +
            ` : mongoDB database \'${dbConnection.db.databaseName}\' connected`);
        if (debug.enabled) {
            debug(modulename + ': printing db stats');
            const stats = await dbConnection.db.command({ dbStats: 1 });
            debug(stats);
        }
        return dbConnection;
    }
    catch (err) {
        logger.error(modulename + ': database connection error');
        dumpError(err);
        throw err;
    }
}
/**
 * Closes a MongoDB database connection.
 * Logs an error if thrown.
 * @params
 * - dbConnection: The database connection to be closed, i.e.
 * a Mongoose or MongoDB connection with a close function.
 * @returns
 * It returns the connection in line with the underlying
 * connection.close() output.
 * @throws
 * It logs and returns (not throws) an error if the underlying
 * connection.close() throws an error.
 */
async function closeConnection(dbConnection) {
    debug(modulename + ': running closeConnection');
    try {
        const connection = await dbConnection.close();
        debug(modulename + ': database connection closed');
        return connection;
    }
    catch (err) {
        const message = ': database connection close error';
        this.logger.error(modulename + message);
        this.dumpError(err);
        return err;
    }
}
/**
 * Creates a Mongoose model (which is an object that allows access to a named mongoDB collection).
 * The model (or collection connection) will be on the parent database instance
 * with the supplied collection name, (and using the supplied schema).
 * @params
 * - this: Accesses logger and dumpError.
 * - ModelName: The name to give the created model.
 * - modelSchema: The schema definition to use in the model.
 * - dbCollectionName: The name of the collection to use.
 * @returns
 * Returns a Mongoose database model object
 * @throws
 * Throws an error if the model creation attempt fails.
 */
function createModel(ModelName, modelSchema, // accepts a Schema
dbCollectionName) {
    debug(modulename + ': running createModel');
    /* id the database collection, define its schema and its model */
    const DbSchema = new mongoose_1.Schema(modelSchema, {
        collection: dbCollectionName,
    });
    try {
        /* compile the model if it doesn't already exist */
        const DbModel = this.dbConnection.models[ModelName] ||
            this.dbConnection.model(ModelName, DbSchema);
        debug(modulename + `: mongoose model \'${DbModel.modelName}\' created`);
        return DbModel;
    }
    catch (err) {
        this.logger.error(modulename + ': database model creation error');
        this.dumpError(err);
        throw err;
    }
}
//# sourceMappingURL=database.js.map