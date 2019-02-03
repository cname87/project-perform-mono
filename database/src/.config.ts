/**
 * This module sets all configuration parameters for the
 * database component.
 * It must be stored in the database directory alongside the index.js file.
 * Their are three configuration items:
 * - filepaths - module file paths
 * - getMongoUrl() - returns database connection uri
 * - getConnectionOptions - returns database connection options object.
 */

/* Note:
This file assumes one database server.
If you wish to configure a second database server, e.g. a local database for when a cloud server is not available then..
- Add getMongoUrl2() and getConnectionOptions2() with the setup for the second server.
- When required manually rename the files and export the appropriate files.
*/

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import * as mongoose from 'mongoose';
import { format } from 'util';

/**
 * The filepaths configuration object.
 * This object stores all internal filepaths used throughout the database component.
 * Allows for easy file location changes.
 */

// a utility to dump errors to the logger
import * as DUMPERROR from '../../utils/dumperror';
// a configured winston general logger
import * as LOGGER from '../../utils/logger';
// Database class
import * as DATABASE from './database';

export interface IFilepaths {
  readonly LOGGER: {
    Logger: typeof LOGGER.Logger;
  };
  readonly DUMPERROR: {
    DumpError: typeof DUMPERROR.DumpError;
  };
  readonly DATABASE: typeof DATABASE;
}
export const filepaths: IFilepaths = {
  LOGGER,
  DUMPERROR,
  DATABASE,
};

/**
 * The Mongoose createConnection url configuration object.
 * This method returns the uri parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
export function getMongoUri(): string {
  /* mongoDB server connection url and connect options */
  const scheme = 'mongodb+srv';
  const user = encodeURIComponent('cname87');
  const password = encodeURIComponent('performMongo_1');
  const host = 'perform-9troj.azure.mongodb.net';
  const db = '/test';
  const ssl = 'true';
  const authSource = 'admin';
  const authMechanism = 'DEFAULT';

  return format(
    '%s://%s:%s@%s%s?ssl=%s&authSource=%s&authMechanism=%s',
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
 * The Mongoose createConnection connection options configuration object.
 * This method returns the options parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
export function getConnectionOptions(): mongoose.ConnectionOptions {
  return {
    // if not connected, return errors immediately
    bufferMaxEntries: 0,
    // prevents mongoose deprecation warning
    useNewUrlParser: true,
  };
}

/**
 * This method returns some options used in database createStore() that creates a session store.
 */

export function getSessionOptions(): DATABASE.ISessionOptions {
  return {
    DB_NAME: '/test/',
    // session store key
    SESSION_KEY: 'session secret key',
    // session store time to live
    SESSION_EXPIRES: 14 * 24 * 60 * 60 * 1000, // 2 weeks
    SESSION_COLLECTION: 'sessions',
  };
}
