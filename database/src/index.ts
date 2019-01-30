/**
 * TBD
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import * as fs from 'fs';
import { format } from 'util';

/* import configuration file */
import { config, filepaths, IConfig } from './.config';

/* internal module dependencies */
const { Database } = filepaths.DATABASE;

/* Create the single instances of the general logger & dumpError
 * utilities, and the server logger middleware.
 * These are passed via the app.locals object.
 * Also, other modules can create new instances later without the parameter
 * and they will receive the same instance. */
const { Logger } = filepaths.LOGGER;
const logger = Logger.getInstance();
const { DumpError } = filepaths.DUMPERROR;
const dumpError = DumpError.getInstance(logger);

// connect to the database
async function runDatabaseApp() {
  debug(modulename + ': running runDatabaseApp');

  logger.info('\n*** CONNECTING TO THE DATABASE ***\n');

  /**
   * Reads the MongoDB url connection string from the configuration file.
   */

  function getMongoUrl(dbConfig: IConfig) {
    /* mongoDB server connection url and connect options */
    const user = encodeURIComponent(dbConfig.DB_USER);
    const password = encodeURIComponent(dbConfig.DB_PASSWORD);
    const host = dbConfig.DB_HOST;
    const port = dbConfig.DB_PORT;
    const authMechanism = dbConfig.AUTH_MECHANISM;
    const authSource = dbConfig.AUTH_SOURCE;
    const sslOn = dbConfig.SSL_ON;
    const db = dbConfig.DB_NAME;
    return format(
      'mongodb://%s:%s@%s:%s/%s' + '?authMechanism=%s&authSource=%s&ssl=%s',
      user,
      password,
      host,
      port,
      db,
      authMechanism,
      authSource,
      sslOn,
    );
  }

  /**
   * Reads the MongoDB connection options object from the configuration file.
   */

  function getConnectionOptions(dbConfig: IConfig) {
    /* read the certificate authority */
    const ca = [fs.readFileSync(dbConfig.DB_CA)];
    /* read the private key and public cert (both stored in the same file) */
    const key = [fs.readFileSync(dbConfig.DB_KEY)];
    const cert = key;
    return {
      // if not connected, return errors immediately
      bufferMaxEntries: 0,
      sslCA: ca,
      sslCert: cert,
      sslKey: key,
      sslValidate: dbConfig.SSL_VALIDATE,
      // prevents mongoose deprecation warning
      useNewUrlParser: true,
    };
  }

  try {
    const connectionUrl = getMongoUrl(config);
    const connectOptions = getConnectionOptions(config);

    const database = await new Database(
      connectionUrl,
      connectOptions,
      logger,
      dumpError,
    );
    return database.dbConnection;
  } catch (err) {
    /* deal with error in caller */
    dumpError(err);
    return err;
  }
}

runDatabaseApp();
