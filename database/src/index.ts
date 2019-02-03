/**
 * This module exports a function.
 *
 * @returns The function returns a Database instance.
 *
 * The database instance includes...
 * An established connection to a database on a MongoDB server.
 * Utility database methods including createModel & createStore.
 * See database module for database instance detail.
 *
 * @throws Throws an error if the database set up fails.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* import configuration file */
import {
  filepaths,
  getConnectionOptions,
  getMongoUri,
  getSessionOptions,
} from './.config';

/* connect to the database */
export async function runDatabaseApp() {
  debug(modulename + ': running runDatabaseApp');

  /* Database class */
  const { Database } = filepaths.DATABASE;

  /*
   * Create the single instances of the general logger & dumpError utilities.
   * (Other modules receive the same instance).
   */
  const { Logger } = filepaths.LOGGER;
  const logger = Logger.getInstance();
  const { DumpError } = filepaths.DUMPERROR;
  const dumpError = DumpError.getInstance(logger);

  logger.info('\n*** CONNECTING TO THE DATABASE ***\n');

  try {
    const connectionUrl = getMongoUri();
    const connectOptions = getConnectionOptions();
    const sessionOptions = getSessionOptions();
    const database = new Database(
      connectionUrl,
      connectOptions,
      sessionOptions,
      logger,
      dumpError,
    );
    /* must await database connection from promise */
    database.dbConnection = await database.dbConnection;
    /* return database instance */
    return database;
  } catch (err) {
    logger.error(modulename + ': database setup error');
    dumpError(err);
    throw err;
  }
}

runDatabaseApp();
