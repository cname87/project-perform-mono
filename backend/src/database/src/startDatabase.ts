/**
 * This module exports a function that connects to an MongoDB database server..
 */

/* external dependencies */
import winston from 'winston';
import { ConnectionOptions } from 'mongoose';
import { setupDebug } from '../../utils/src/debugOutput';

import { configDatabase } from '../configDatabase';
import { Database } from './database';

const { modulename, debug } = setupDebug(__filename);

/**
 * This function connects to a MongoDB server database.
 *
 * The database server started will be either local or hosted connection and the database used will be either a test or a production database depending on process.env parameters.
 *
 * @returns The function returns a Database instance.
 *
 * The database instance includes...
 * - A promise to an established connection to a database on a MongoDB server.
 * - Utility database methods - see database module for database instance detail.
 *
 * @throws Throws an error if the database set up fails.
 */
async function startDatabase(
  config: {
    getMongoUri: () => string;
    getConnectionOptions: () => ConnectionOptions;
  } = configDatabase,
  DatabaseClass: Perform.DatabaseConstructor = Database,
  logger: winston.Logger | Console = console,
  dumpError: Perform.DumpErrorFunction = console.error,
): Promise<Perform.Database> {
  debug(`${modulename}: running startDatabase`);

  try {
    const connectionUrl = config.getMongoUri();
    const connectOptions = config.getConnectionOptions();
    const database = new DatabaseClass(
      connectionUrl,
      connectOptions,
      logger,
      dumpError,
    );
    /* await connection and store back in database object */
    database.dbConnection = await database.connectToDB();

    /* return database instance */
    return database;
  } catch (err) {
    logger.error(`${modulename}: database failed to setup`);
    dumpError(err);
    throw err;
  }
}

/* export for main server */
export { startDatabase };
