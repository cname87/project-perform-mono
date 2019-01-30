/**
 * This module returns a database object with methods/API to carry
 * out basic MongoDB database operations..
 *
 * The database object provides the following methods:
 * createModel:
 * Returns a mongoose model based on supplied parameters.
 * createSession:
 * Returns an Express/Mongo sessionstore.
 * closeConnection:
 * Closes a supplied connection to the MongoDB server.
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import connectMongo from 'connect-mongodb-session';
import expressSession from 'express-session';
import mongoose from 'mongoose';
import winston = require('winston');

/**
 * The class constructor for the exported database object.
 */
export class Database {
  public dbConnection: any;
  public createModel: (...params: any) => any;
  public createStore: (...params: any) => any;
  public closeConnection: (...params: any) => any;
  public closeStore: (...params: any) => any;
  public createSession: (...params: any) => any;

  constructor(
    readonly connectionUrl: string,
    readonly connectionOptions: object,
    readonly logger: winston.Logger | Console['error'] = console.error,
    readonly dumpError: any = console.error,
  ) {
    this.dbConnection = connectToDB(connectionUrl, connectionOptions);
    this.createModel = createModel;
    this.createStore = createStore;
    this.closeConnection = closeConnection;
    this.closeStore = closeStore;
    this.createSession = createSession;
  }
}

/**
 * Creates a connection to a database on the MongoDB server.
 * If debug is enabled it also prints stats (to debug) on the configured
 * database.
 * @return
 * Returns a resolved promise to a Mongoose database connection object.
 * @throws
 * Throws a rejected promise if the connection attempt fails.
 */

async function connectToDB(this: any, url: string, options: object) {
  debug(modulename + ': running connectToDB');

  try {
    const dbConnection = await mongoose.createConnection(url, options);

    /* for all models => immediate error if database is disconnected */
    mongoose.set('bufferCommands', false);
    debug(
      modulename +
        ' : mongoDB database ' +
        `\'${dbConnection.db.databaseName}\' connected`,
    );

    if (debug.enabled) {
      debug(modulename + ': printing db stats');
      const stats = await dbConnection.db.command({ dbStats: 1 });
      debug(stats);
    }

    return dbConnection;
  } catch (err) {
    this.logger.error(modulename + ': database connection error');
    this.dumpError(err);
    throw err;
  }
}

/**
 * Creates a Mongoose model based on a supplied database
 * connection instance, schema, and collection.
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
  this: any,
  ModelName: any,
  modelSchema: any,
  dbCollectionName: any,
  dbConnection: any,
) {
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
 * @returns
 * Returns a Mongo session store.
 * @throws
 * Throws an error if the store creation attempt fails.
 */

async function createStore(this: any) {
  debug(modulename + ': running createStore');

  /* need to capture this.config here to use in constructor below */
  const localConfig = this.config;

  /* get base connection url and options */
  const url = this.connectionUrl;
  const connectOptions = this.connectionOptions;
  let store: any = {};

  try {
    return await new Promise((resolve, reject) => {
      /* get the connect-mongodb-session constructor */
      const MongoStore = connectMongo(expressSession);

      store = new MongoStore({
        collection: localConfig.SESSION_COLLECTION,
        connectionOptions: connectOptions as any,
        databaseName: localConfig.DB_NAME,
        expires: localConfig.SESSION_EXPIRES,
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
     * a CTRL+C to close node */
    this.logger.error(modulename + ': mongo store creation error');
    this.dumpError(err);
    throw err;
  }
}

/**
 * Closes a MongoDB database connection.
 * Logs an error if thrown.
 * dbConnection:
 * The database connection to be closed, i.e.
 * a Mongoose or MongoDB connection with a close function.
 * @returns
 * It returns the connection in line with the underlying
 * connection.close() output.
 * @throws
 * It logs and returns (not throws) an error if the underlying
 * connection.close() throws an error.
 */

async function closeConnection(this: any, dbConnection: any) {
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
 * Closes a MongoStore database connection.
 * dbStore: The MongoStore connection to be closed, i.e.
 * a connect-mongoDB-session store with a client.close function.
 * @returns
 * It returns the input MongoStore (whose client.isConnected
 * function should now return false).
 * @throws
 * It logs and returns (not throws) an error if the underlying
 * store.close() throws an error.
 */

async function closeStore(this: any, dbStore: any) {
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
 * sessionStore: Mongo store to persist session information.
 * cookieKey: The secret key used to sign cookies.
 * @returns
 * An object used by the Express app to manage http session state.
 */

function createSession(sessionStore: any, cookieKey: any) {
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
