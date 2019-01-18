/**
 * This module sets all configuration parameters for the
 * database component.
 * It must be stored in the database directory alongside the index.js file.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

// tslint:disable:ordered-imports

// a configured winston general logger
import * as LOGGER from '../../utils/logger';
// a utility to dump errors to the logger
import * as DUMPERROR from '../../utils/dumperror';
// database files
import * as DATABASE from './database';
import * as EXT_DB_SERVICE from './extDatabaseService';

interface IConfig {
  readonly LOGGER: {
    Logger: typeof LOGGER.Logger;
  };
  readonly DUMPERROR: {
    DumpError: typeof DUMPERROR.DumpError;
  };
  readonly DATABASE: typeof DATABASE;
  readonly EXT_DB_SERVICE: typeof EXT_DB_SERVICE;
  readonly [index: string]: any;
}

// tslint:disable:object-literal-sort-keys
export const config: IConfig = {
  /***********************************************************************/
  /* File paths to all internal modules                                  */
  /***********************************************************************/

  LOGGER,
  DUMPERROR,
  DATABASE,
  EXT_DB_SERVICE,

  /***********************************************************************/
  /* Winston logger parameters                                           */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the Winston general
   * logger middleware.
   */

  // log file paths used to set up the logger
  INFO_LOG: '../logs/info.log',
  ERROR_LOG: '../logs/error.log',

  /***********************************************************************/
  /* Database parameters                                                 */
  /***********************************************************************/

  /**
   * This section sets all configuration parameters for the database.
   * The database is set up in a modular fashion, i.e. it depends only
   * on the parameters below.
   */

  // path to the function that starts the external database server
  get START_DB_SERVICE() {
    return this.EXT_DB_SERVICE;
  },
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
  DB_CA: '../certs/rootCA.crt',
  DB_KEY: '../certs/nodeKeyAndCert.pem',
  DB_CERT: '../certs/nodeKeyAndCert.pem',
  SSL_VALIDATE: true,
};
