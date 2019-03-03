/**
 * This module exports a function that connects to an online MongoDB database.
 * See function detail below.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* import configuration file */
import { filepaths, getConnectionOptions, getMongoUri } from './configDatabase';
// tslint:disable-next-line: ordered-imports
import * as dotenv from 'dotenv';
dotenv.config({ path: filepaths.ENV_FILE });

/**
 * This function connects to a MongoDB online database.
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
    const database = new Database(
      connectionUrl,
      connectOptions,
      logger,
      dumpError,
    );
    /* must await database connection from promise */
    database.dbConnection = await database.dbConnectionPromise;
    /* return database instance */
    return database;
  } catch (err) {
    logger.error(modulename + ': database failed to setup');
    dumpError(err);
    throw err;
  }
}
