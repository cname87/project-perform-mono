/**
 * This module sets all configuration parameters for the
 * database component.
 *
 * It must be stored in the database directory alongside the index.js file.
 * Their are 4 configuration items:
 * - filepaths - module file paths.
 * - internal module types (dumpError) needed by other modules.
 * - getMongoUrl() - returns database connection uri.
 * - getConnectionOptions - returns database connection options object.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import { ConnectionOptions } from 'mongoose';
import { format } from 'util';

/**
 * The filepaths configuration object.
 * This object stores all internal filepaths used throughout the database component.
 * Allows for easy file location changes.
 */

// a utility to dump errors to the logger
import * as DUMPERROR from '../../utils/src/dumperror';
// a configured winston general logger
import * as LOGGER from '../../utils/src/logger';
// Database class
import * as DATABASE from './database';

export interface IFilepaths {
  readonly DATABASE: typeof DATABASE;
  readonly DUMPERROR: {
    DumpError: typeof DUMPERROR.DumpError;
  };
  readonly LOGGER: {
    Logger: typeof LOGGER.Logger;
  };
}
export const filepaths: IFilepaths = {
  DATABASE,
  DUMPERROR,
  LOGGER,
};

/* export types needed in other modules */
export type dumpErrorFunction = DUMPERROR.dumpErrorInstance;
export type Database = DATABASE.Database;
/**
 * This method returns the uri parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
export function getMongoUri(): string {
  /* mongoDB server connection url and connect options */
  const scheme = 'mongodb+srv';
  const user = encodeURIComponent('cname87');
  const password = encodeURIComponent('performMongo_1');
  const host = 'perform-9troj.azure.mongodb.net';
  const db = 'test';
  const ssl = 'true';
  const authSource = 'admin';
  const authMechanism = 'DEFAULT';

  return format(
    '%s://%s:%s@%s/%s?ssl=%s&authSource=%s&authMechanism=%s',
    scheme,
    user,
    password,
    host,
    db,
    ssl,
    authSource,
    authMechanism,
  );
}

/**
 * This method returns the options parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
export function getConnectionOptions(): ConnectionOptions {
  return {
    // if not connected, return errors immediately
    bufferMaxEntries: 0,
    // prevents mongoose deprecation warning
    useNewUrlParser: true,
  };
}
