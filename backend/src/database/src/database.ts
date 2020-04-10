/**
 * This module returns a database object with a connectToDB and other methods to carry out database operations.
 *
 * The database connection is to a MongoDB server.
 *
 * The database object is instantiated with the following parameters:
 * - mongoose.createConnection uri and options parameters.
 * - options Logger and dumpError parameters.
 *
 * The database object provides the following properties:
 * - dbConnection: null - used to store dbConnection when externally resolved from connectToDB()
 *
 * The database object provides the following methods:
 * - closeConnection: Closes a supplied connection to the MongoDB server.
 * - createModel: Returns a Mongoose model based on supplied parameters.
 */

/* output a header */

/* external type dependencies */
import mongoose, {
  Connection,
  ConnectionOptions,
  Document,
  Model,
  Schema,
  SchemaDefinition,
} from 'mongoose';
import winston from 'winston';
import { setupDebug } from '../../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/**
 * Creates a connection to a database on the MongoDB server.
 * If a connection is not possible, the connection attempt will time out after 30s and throw an error.
 * If debug is enabled it also prints stats (to debug) on the configured
 * database.
 * @params
 * - uri: mongoose connection uri.
 * - options: mongoose connection options.
 * - logger: logger function.
 * - dumpError: dumpError function.
 * @returns
 * -Returns a promise to a Mongoose database connection object.
 * - Throws an error if the connection attempt fails.
 */
async function connectToDB(
  this: Database,
  uri = this._connectionUrl,
  options = this._connectionOptions,
): Promise<Connection> {
  debug(`${modulename}: running connectToDB`);

  try {
    debug(`${modulename}: trying to connect to the database server`);

    const dbConnection = await mongoose.createConnection(uri, options);

    /* for all models => disable buffering commands so an error is thrown immediately when a connection goes down */
    mongoose.set('bufferCommands', false);

    debug(
      `${modulename} : database \'${dbConnection.db.databaseName}\' connected`,
    );

    if (debug.enabled) {
      debug(`${modulename}: printing db stats`);
      const stats = await dbConnection.db.command({ dbStats: 1 });
      debug(stats);
    }

    return dbConnection;
  } catch (err) {
    this.logger.error(
      `${modulename}: database error during connection attempt`,
    );
    this.dumpError(err);
    throw err;
  }
}

/**
 * Closes a MongoDB database connection.
 * Throws an error if there is an error on connection.
 * @params
 * - dbConnection: The database connection to be closed, i.e.
 * a Mongoose or MongoDB connection with a close function.
 * - force: Passed to force close which can clear timers etc if you are closing after an error. The connection cannot be used again and it emits no events during closure.
 * @returns
 * It returns the connection in line with the underlying
 * connection.close() output.
 * It logs and throws an error if the underlying
 * connection.close() throws an error.
 */
async function closeConnection(
  this: Database,
  dbConnection: Connection,
  force = false,
): Promise<void> {
  debug(`${modulename}: running closeConnection`);

  try {
    /* remove close event listeners to avoid triggering an error */
    dbConnection.removeAllListeners('close');
    dbConnection.removeAllListeners('disconnected');
    const connection = await dbConnection.close(force);
    debug(
      `${modulename}: database connection successfully closed by closeConnection`,
    );
    return connection;
  } catch (err) {
    const message = ': database connection error during closeConnection';
    this.logger.error(modulename + message);
    this.dumpError(err);
    throw err;
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
function createModel(
  this: Database,
  ModelName: string,
  modelSchema: SchemaDefinition, // accepts a Schema
  dbCollectionName: string,
): Model<Document, {}> {
  debug(`${modulename}: running createModel`);

  /* id the database collection, define its schema and its model */
  const DbSchema = new Schema(modelSchema, {
    collection: dbCollectionName,
  });

  try {
    /* compile the model if it doesn't already exist */
    const DbModel =
      this.dbConnection.models[ModelName] ||
      this.dbConnection.model(ModelName, DbSchema);
    debug(`${modulename}: mongoose model \'${DbModel.modelName}\' created`);
    return DbModel;
  } catch (err) {
    this.logger.error(`${modulename}: database model creation error`);
    this.dumpError(err);
    throw err;
  }
}

/**
 * The class constructor for the exported database object.
 */
class Database {
  public set dbConnection(connection: Connection) {
    this._dbConnection = connection;
  }

  public get dbConnection(): Connection {
    return this._dbConnection;
  }

  public closeConnection: (
    this: Database,
    dbConnection: Connection,
    force?: boolean,
  ) => Promise<void>;

  public createModel: (
    this: Database,
    ModelName: string,
    modelSchema: SchemaDefinition,
    dbCollectionName: string,
  ) => Model<Document, {}>;

  public connectToDB: (
    this: Database,
    uri?: string,
    options?: ConnectionOptions,
  ) => Promise<Connection>;

  private _dbConnection: Connection = ({} as unknown) as Connection;

  protected _connectionUrl = '';

  protected _connectionOptions: ConnectionOptions = {};

  constructor(
    readonly connectionUrl: string,
    readonly connectionOptions: ConnectionOptions,
    readonly logger: winston.Logger | Console = console,
    readonly dumpError: Perform.DumpErrorFunction = console.error,
  ) {
    this._connectionUrl = connectionUrl;
    this._connectionOptions = connectionOptions;
    this.closeConnection = closeConnection;
    this.createModel = createModel;
    this.connectToDB = connectToDB;
  }
}

/* export the Database class */
export { Database };
