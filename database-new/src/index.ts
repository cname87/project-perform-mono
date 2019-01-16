/**
 * TBD
 */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* import configuration file */
import { config } from './.config';

/* internal module dependencies */
const { Database }= config.DATABASE;

/* Create the single instances of the general logger & dumpError
 * utilities, and the server logger middleware.
 * These are passed via the app.locals object.
 * Also, other modules can create new instances later without the parameter
 * and they will receive the same instance. */
const { Logger } = config.LOGGER;
const logger = Logger.getInstance(config);
const { DumpError } = config.DUMPERROR;
const dumpError = DumpError.getInstance(logger);


// connect to the database
async function runDatabaseApp() {
  debug(modulename + ': running runDatabaseApp');

  logger.info('\n*** CONNECTING TO THE DATABASE ***\n');

  try {
    const database = await new Database(config, logger, dumpError);
    const dbConnection = await database.connectToDB();
    return dbConnection;
  } catch (err) {
    /* deal with error in caller */
    return err;
  }

}

runDatabaseApp();
