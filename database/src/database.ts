/**
 * This module returns a database object with a database connection promise and methods to carry out database operations.
 * The database is a MongoDB server.
 * The database object is instantiated with the following parameters:
 * - mongoose.createConnection uri and options parameters.
 * - options Logger and dumpError parameters.
 *
 * The database object provides the following methods:
 * closeConnection: Closes a supplied connection to the MongoDB server.
 * createModel: Returns a mongoose model based on supplied parameters.
 * createStore: Returns a mongo session store.
 * closeStore: Closes a supplied mongo session store.
 * createSession:  Returns an Express/Mongo sessionstore.
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* import dumpError function type */
import { dumpErrorFunction } from './.config';

/* external dependencies */
import connectMongodbSession from 'connect-mongodb-session';
// import connectMongo from 'connect-mongodb-session';
import expressSession from 'express-session';
/* get the connect-mongodb-session constructor */
const MongoStore = connectMongodbSession(expressSession);
import { MongoClientOptions } from 'mongodb';
import mongoose, { Connection } from 'mongoose';
import winston = require('winston');

/* session creation options needed by createStore */
export interface ISessionOptions {
  DB_NAME: string;
  SESSION_KEY: string;
  SESSION_EXPIRES: number;
  SESSION_COLLECTION: string;
}
const dummy = expressSession();
type reqHandler = typeof dummy;

/**
 * The class constructor for the exported database object.
 */
export class Database {
  /* initially a promise, later resolved */
  public dbConnection: Promise<mongoose.Connection> | mongoose.Connection;
  public closeConnection: (
    this: Database,
    dbConnection: Connection,
  ) => Promise<void>;
  public createModel: (
    this: Database,
    ModelName: string,
    modelSchema: mongoose.Schema,
    dbCollectionName: string,
    dbConnection: Connection,
  ) => mongoose.Model<mongoose.Document, {}>;
  public createStore: (this: Database) => Promise<typeof MongoStore>;
  public closeStore: (
    this: Database,
    dbStore: typeof MongoStore,
  ) => Promise<typeof MongoStore>;
  public createSession: (
    sessionStore: typeof MongoStore,
    cookieKey: string,
  ) => reqHandler;

  constructor(
    readonly connectionUrl: string,
    readonly connectionOptions: mongoose.ConnectionOptions,
    readonly sessionOptions: ISessionOptions,
    readonly logger: winston.Logger | Console = console,
    readonly dumpError: dumpErrorFunction | Console['error'] = console.error,
  ) {
    this.closeConnection = closeConnection;
    this.createModel = createModel;
    this.createStore = createStore;
    this.closeStore = closeStore;
    this.createSession = createSession;
    this.dbConnection = connectToDB(
      connectionUrl,
      connectionOptions,
      logger,
      dumpError,
    );
  }
}

/**
 * Creates a connection to a database on the MongoDB server.
 * If debug is enabled it also prints stats (to debug) on the configured
 * database.
 * @params
 * uri: mongoose connection uri.
 * options: mongoose connection options.
 * logger: logger function.
 * dumpError: dumpError function.
 * @returns Returns a promise to a Mongoose database connection object.
 * @throws Throws an error if the connection attempt fails.
 */
async function connectToDB(
  uri: string,
  options: mongoose.ConnectionOptions,
  logger: winston.Logger | Console,
  dumpError: dumpErrorFunction | Console['error'],
): Promise<Connection> {
  debug(modulename + ': running connectToDB');

  try {
    const dbConnection = await mongoose.createConnection(uri, options);

    /* for all models => disable mongoose buffering option */
    mongoose.set('bufferCommands', false);

    debug(
      modulename +
        ` : mongoDB database \'${dbConnection.db.databaseName}\' connected`,
    );

    if (debug.enabled) {
      debug(modulename + ': printing db stats');
      const stats = await dbConnection.db.command({ dbStats: 1 });
      debug(stats);
    }

    return dbConnection;
  } catch (err) {
    logger.error(modulename + ': database connection error');
    dumpError(err);
    throw err;
  }
}

/**
 * Closes a MongoDB database connection.
 * Logs an error if thrown.
 * @params
 * dbConnection: The database connection to be closed, i.e.
 * a Mongoose or MongoDB connection with a close function.
 * @returns
 * It returns the connection in line with the underlying
 * connection.close() output.
 * @throws
 * It logs and returns (not throws) an error if the underlying
 * connection.close() throws an error.
 */
async function closeConnection(
  this: Database,
  dbConnection: Connection,
): Promise<void> {
  debug(modulename + ': running closeConnection');

  try {
    const connection = await dbConnection.close();
    debug(modulename + ': database connection closed');
    return connection;
  } catch (err) {
    const message = ': database connection close error';
    this.logger.error(modulename + message);
    this.dumpError(err);
    return err;
  }
}

/**
 * Creates a Mongoose model based on a supplied database
 * connection instance, schema, and collection.
 * @params
 * this: Accesses logger and dumpError.
 * ModelName: The name to give the created model.
 * modelSchema: The schema to use in the model.
 * dbCollectionName: The name of the collection to use.
 * dbConnection: The connection to the database to use.
 * @returns
 * Returns a Mongoose database model object
 * @throws
 * Throws an error if the model creation attempt fails.
 */
function createModel(
  this: Database,
  ModelName: string,
  modelSchema: mongoose.Schema,
  dbCollectionName: string,
  dbConnection: Connection,
): mongoose.Model<mongoose.Document, {}> {
  debug(modulename + ': running createModel');

  /* id the database collection, define its schema and its model */
  const Schema = new mongoose.Schema(modelSchema, {
    collection: dbCollectionName,
  });

  try {
    const Model = dbConnection.model(ModelName, Schema);
    debug(modulename + `: mongoose model \'${Model.modelName}\' created`);
    return Model;
  } catch (err) {
    this.logger.error(modulename + ': database model creation error');
    this.dumpError(err);
    throw err;
  }
}

/**
 * Creates an Mongo session store using connect-mongoDB-session.
 * Note: It creates a database connection which must be closed
 * to allow node exit.
 * Note: It appears that a new store is created each time you run
 * this (even though the server parameters are identical). You
 * have to close each one separately.
 * @params
 * this: Accesses logger and dumpError.
 * @returns
 * Returns a Mongo session store.
 * @throws
 * Throws an error if the store creation attempt fails.
 */

async function createStore(this: Database): Promise<typeof MongoStore> {
  debug(modulename + ': running createStore');

  /* get base connection url and options */
  const url = this.connectionUrl;
  const connectOptions = this.connectionOptions;
  const sessionOptions = this.sessionOptions;

  try {
    return await new Promise((resolve, reject) => {
      const store = new MongoStore({
        collection: sessionOptions.SESSION_COLLECTION,
        /* appear to be differences between mongo and mongoose connection type definitions i.e. sslValidate => cast */
        connectionOptions: connectOptions as MongoClientOptions,
        databaseName: sessionOptions.DB_NAME,
        expires: sessionOptions.SESSION_EXPIRES,
        idField: '_id',
        uri: url,
      });

      store.on('connected', () => {
        resolve(store);
      });

      store.on('error', (err: Error) => {
        reject(err);
      });
    });
  } catch (err) {
    /* note certain types of connection errors can require
    a CTRL+C to close node */
    this.logger.error(modulename + ': mongo store creation error');
    this.dumpError(err);
    throw err;
  }
}

/**
 * Closes a MongoStore connection.
 * @params
 * dbStore: The MongoStore connection to be closed, i.e.
 * a connect-mongoDB-session store with a client.close function.
 * @returns
 * It returns the input MongoStore (whose client.isConnected
 * function should now return false).
 * @throws
 * It logs and returns (not throws) an error if the underlying
 * store.close() throws an error.
 */
async function closeStore(
  this: Database,
  dbStore: typeof MongoStore,
): Promise<typeof MongoStore> {
  debug(modulename + ': running closeStore');

  try {
    await dbStore.client.close();
    debug(modulename + ': MongoStore connection closed');
    return dbStore;
  } catch (err) {
    const message = ': MongoStore connection close error';
    this.logger.error(modulename + message);
    this.dumpError(err);
    return err;
  }
}

/**
 * This method takes a Mongo store (created using createStore) and a
 * secret used to generate signed cookies and returns an express-session
 * used to store information across http requests.
 * @params
 * sessionStore: Mongo store to persist session information.
 * cookieKey: The secret key used to sign cookies.
 * @returns
 * An object used by the Express app to manage http session state.
 */

function createSession(
  sessionStore: typeof MongoStore,
  cookieKey: string,
): reqHandler {
  debug(modulename + ': running createSession');

  const expires = new Date(60 * 60 * 24 * 7 * 1e3 + Date.now());
  return expressSession({
    cookie: {
      expires,
      httpOnly: false,
      path: '/',
      secure: true,
      signed: true,
    },
    resave: false,
    /* resets expires on each cookie receipt */
    rolling: true,
    saveUninitialized: false,
    secret: cookieKey,
    /* provided by connect-mongodb-session, or other store */
    store: sessionStore,

    /* deletes persisted session when you delete req.session */
    unset: 'destroy',
  });
}
