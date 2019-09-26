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
import appRootObject = require('app-root-path');
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
const appRoot = appRootObject.toString();
import { ConnectionOptions } from 'mongoose';
import path = require('path');
import { format } from 'util';
import fs from 'fs';

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

/* a utility to dump errors to the logger */
import { DumpError } from '../../utils/src/dumpError';
/* a configured winston general logger */
import { Logger } from '../../utils/src/logger';
/* the Database class */
import { Database } from './database';

export const filepaths = {
  Database,
  DumpError,
  Logger,
};

/* the Database class is the type for instances of the Database class */
export type Database = Database;

/**
 * This method returns the uri parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
 */
export function getMongoUri(): string {
  const server = process.env.DB_IS_LOCAL === 'true' ? 'local' : 'remote';
  debug(modulename + ` : ${server} database server in use`);

  /* local or remte mongoDB server */
  const scheme = process.env.DB_IS_LOCAL === 'true' ? 'mongodb' : 'mongodb+srv';

  /* both local and server databases use the same admin username and password */
  const user = encodeURIComponent(process.env.DB_USER as string);
  const password = encodeURIComponent(process.env.DB_PASSWORD as string);
  const host =
    process.env.DB_IS_LOCAL === 'true'
      ? 'localhost' // port defaults to 27017
      : (process.env.DB_HOST as string);
  /* the mongoDB database is either a test database or a production database */
  const db =
    process.env.DB_MODE === 'production'
      ? (process.env.DB_DATABASE as string)
      : (process.env.DB_DATABASE_TEST as string);
  debug(modulename + ` : database ${db} in use`);
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
  /* read the certificate authority */
  const ROOT_CA = path.join(appRoot, 'database', 'certs', 'rootCA.crt');
  const ca = [fs.readFileSync(ROOT_CA)];
  /* read the private key and public cert (both stored in the same file) */
  const HTTPS_KEY = path.join(
    appRoot,
    'database',
    'certs',
    'mongoKeyAndCert.pem',
  );
  const key = fs.readFileSync(HTTPS_KEY);
  const cert = key;
  const sslValidate = process.env.DB_IS_LOCAL === 'true' ? true : false;

  return {
    sslCA: ca,
    sslCert: cert,
    sslKey: key,
    sslValidate,
    /* if not connected, return errors immediately */
    bufferMaxEntries: 0,
    /* prevent mongoose deprecation warnings */
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
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
