/**
 * This module sets all configuration parameters for the
 * database component.
 * It must be stored in the database directory alongside the index.js file.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import * as appRootObject from 'app-root-path';
const appRoot = appRootObject.toString();
import * as path from 'path';

// a utility to dump errors to the logger
import * as DUMPERROR from '../../utils/dumperror';
// a configured winston general logger
import * as LOGGER from '../../utils/logger';
// database files
import * as DATABASE from './database';

/**
 * This object sets all internal filepaths used throughout the database component.
 */
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
 * This section sets all configuration parameters for the database.
 * The database is set up in a modular fashion, i.e. it depends only
 * on the parameters below.
 */
// tslint:disable:object-literal-sort-keys
export interface IConfig {
  readonly SSL_VALIDATE: boolean;
  readonly [index: string]: any;
}
export const config: IConfig = {
  /* mongoDB url connection parameters */
  DB_USER: 'syPerformAdmin',
  DB_PASSWORD: 'projectPerform',
  DB_HOST: 'localhost',
  DB_PORT: '27017',
  // database to use on the server
  DB_NAME: 'test',
  AUTH_MECHANISM: 'DEFAULT',
  AUTH_SOURCE: 'admin',
  SSL_ON: 'true',
  /* mongoDB connection options object */
  DB_CA: path.join(appRoot, 'certs', 'rootCA.crt'),
  DB_KEY: path.join(appRoot, 'certs', 'nodeKeyAndCert.pem'),
  DB_CERT: path.join(appRoot, 'certs', 'nodeKeyAndCert.pem'),
  SSL_VALIDATE: true,
};
