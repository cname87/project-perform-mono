/**
 * This module sets all configuration parameters for the
 * database component.
 *
 * It must be stored alongside the database index.js file as it is called from index.js using a relative path.
 *
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
import * as appRootObject from 'app-root-path';
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
const appRoot = appRootObject.toString();
import { ConnectionOptions } from 'mongoose';
import * as path from 'path';
import { format } from 'util';

/**
 * The filepaths configuration object.
 *
 * This object stores all internal module objects used throughout the database component.  It allows for easy file location changes.
 *
 * Note that module paths are relative to the location of this file and that translates to the compiled dist file.
 * The path to the .env file is absolute (as this is not created in the /dist directtory during compilation).
 *
 * NOTE:  If the relative location of any referenced file changes then the relative path must be updated below.
 */

// a utility to dump errors to the logger
import { DumpError } from '../../utils/src/dumpError';
// a configured winston general logger
import { Logger } from '../../utils/src/logger';
// the Database class
import { Database } from './database';
// relative path to backend .env file
const ENV_FILE = path.join(appRoot, '.env');

export const filepaths = {
  Database,
  DumpError,
  Logger,
  ENV_FILE,
};

/* the Database class is the type for instances of the Database class */
export type Database = Database;

/**
 * This method returns the uri parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
export function getMongoUri(): string {
  /* mongoDB server connection url and connect options */
  const scheme = 'mongodb+srv';
  const user = encodeURIComponent(process.env.DB_USER as string);
  const password = encodeURIComponent(process.env.DB_PASSWORD as string);
  const host = process.env.DB_HOST as string;
  const db = process.env.DB_DATABASE as string;
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
    /* if not connected, return errors immediately */
    bufferMaxEntries: 0,
    /* prevents mongoose deprecation warning */
    useNewUrlParser: true,
    /* prevents mongoose deprecation warning */
    useCreateIndex: true,
  };
}

/* path to database index.js file for unit test */
export const indexPath = path.join(appRoot, 'dist', 'database', 'src', 'index');

/* type for database readystate */
export const enum DBReadyState {
  Disconnected = 0,
  Connected = 1,
  Connecting = 2,
  Disconnecting = 3,
}
