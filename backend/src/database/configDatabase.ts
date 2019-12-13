/**
 * This module sets all configuration parameters for the
 * database component.
 *
 * It includes two functions:
 * - getMongoUrl() - returns database connection uri.
 * - getConnectionOptions() - returns database connection options object.
 */

/* output a header */
import { setupDebug } from '../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

/* external dependencies */
import { ConnectionOptions } from 'mongoose';
import { format } from 'util';
import fs from 'fs';
import { resolve } from 'path';

export const configDatabase = {
  /* the name of the individual databases within the mongoDB server */
  DB_DATABASE: 'perform',
  /* to be used for all tests */
  DB_DATABASE_TEST: 'test',

  /**
   * This method returns the uri parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
   */
  getMongoUri: (): string => {
    const server = process.env.DB_IS_LOCAL === 'true' ? 'local' : 'remote';
    debug(modulename + ` : ${server} database server in use`);

    /* local or remote mongoDB server - local is only used if DB_IS_LOCAL is true */
    const scheme =
      process.env.DB_IS_LOCAL === 'true' ? 'mongodb' : 'mongodb+srv';

    /* the credentials are chosen to match the local or remote mongoDB server */
    const user =
      process.env.DB_IS_LOCAL === 'true'
        ? encodeURIComponent(process.env.DB_LOCAL_USER as string)
        : encodeURIComponent(process.env.DB_USER as string);
    const password =
      process.env.DB_IS_LOCAL === 'true'
        ? encodeURIComponent(process.env.DB_LOCAL_PASSWORD as string)
        : encodeURIComponent(process.env.DB_PASSWORD as string);
    const host =
      process.env.DB_IS_LOCAL === 'true'
        ? (process.env.DB_LOCAL_HOST as string)
        : (process.env.DB_HOST as string);

    /* the mongoDB database to use within the database server is either a test database or a production database */
    /* the production database is only used when NODE_ENV and DB_MODE are 'production'=> you can use the 'test' database with NODE_ENV = 'production' if required */
    const db =
      process.env.NODE_ENV === 'production' &&
      process.env.DB_MODE === 'production'
        ? (configDatabase.DB_DATABASE as string)
        : (configDatabase.DB_DATABASE_TEST as string);
    debug(modulename + ` : database \'${db}\' in use`);
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
  },

  /**
   * This method returns the options parameter in Mongoose.createConnection(uri options) that connects to a MongoDB database server.
   */
  getConnectionOptions: (): ConnectionOptions => {
    /* read the certificate authority */
    const ROOT_CA = resolve('backend', 'certs', 'database', 'rootCA.crt');
    const ca = [fs.readFileSync(ROOT_CA)];
    /* read the private key and public cert (both stored in the same file) */
    const HTTPS_KEY = resolve(
      'backend',
      'certs',
      'database',
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
      /* don't buffer commands if not connected, i.e. return error immediately */
      bufferMaxEntries: 0,
      /* next 4 prevent mongoose deprecation warnings */
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
      poolSize: 10, // default = 5
      keepAlive: true, // default true
      keepAliveInitialDelay: 300000, // default 300000
      socketTimeoutMS: 0, // default 360000
      appname: 'perform',
      loggerLevel: 'error', // default 'error'
      validateOptions: true,
    };
  },

  /* path to database index.js file for unit test */
  startDatabasePath: resolve(
    'backend',
    'dist',
    'src',
    'database',
    'src',
    'startDatabase',
  ),
};
