/**
 * This module exports a function that connects to an online MongoDB database.
 * See function detail below.
 *
 */

/* import configuration parameters into process.env first */
/* the .env file must be in process.cwd() */
import dotenv = require('dotenv');
dotenv.config();

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import winston = require('winston');

/* import configuration file */
import {
  Database,
  filepaths,
  getConnectionOptions,
  getMongoUri,
} from './configDatabase';

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
async function runDatabaseApp(): Promise<Database> {
  debug(modulename + ': running runDatabaseApp');

  /* create the single instance of the general logger and dumpError utility */
  const Logger = filepaths.Logger;
  const logger = new Logger() as winston.Logger;
  const DumpError = filepaths.DumpError;
  const dumpError = new DumpError(logger) as (err: any) => void;

  logger.info('\n*** CONNECTING TO THE DATABASE ***\n');

  try {
    const connectionUrl = getMongoUri();
    const connectOptions = getConnectionOptions();
    const database = new filepaths.Database(
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

/* export Database instance type and database creation function */
export { Database, runDatabaseApp };
