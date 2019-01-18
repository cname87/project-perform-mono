'use strict';

/**
 * This module starts up a database.
 * It assumes a Windows service is set up to
 * start a database.
 * The user account running node must have permission
 * to start and stop the Windows service.
 * It provides the following functions:
 * startDB
 * Attempts to start a MongoDB database.
 * shutdownDB
 * Attempts to stop a MongoDB database.
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* dependencies */
import util from 'util';
import * as sc from 'windows-service-controller';

/**
 * Starts a database configured as a windows service.
 * If called on an open service it will leave it open and
 * not do any damage.
 * @returns
 * It returns a promise after a time interval => use async/await to
 * ensure the database is started before proceeding.
 * Returns 0 if the service was already running.
 * Returns 1 if the service was started.
 * Returns the error if an error is thrown by the service start facility.
 */

const sleep = util.promisify(setTimeout);

export async function startDB(config: any) {
  debug(modulename + ': running startDB');

  const { Logger } = config.LOGGER;
  const logger = Logger.getInstance(config);
  const { DumpError } = config.DUMPERROR;
  const dumpError = DumpError.getInstance(logger);

  try {
    const scQuery = await sc.query({
      name: 'mongoDB_27017',
    });

    if (!scQuery[0].state.running) {
      /* allow a pause to avoid errors in the log */
      await sleep(5000);
      await sc.start('mongoDB_27017', {
        timeout: 5,
      });
      await sleep(10000);
      debug(modulename + ': mongoDB_27017 service was started');
      return 1;
    }

    debug(modulename + ': mongoDB_27017 service was already started');
    return 0;
  } catch (err) {
    logger.error(modulename + ': mongoDB startup error');
    err.message = 'mongod start up failure';
    dumpError(err);
    return err;
  }
}

/**
 * Shuts down the database configured as a Windows service.
 * If called on a closed service it will leave it closed and
 * not do any damage.
 * @returns
 * It returns a promise after a time interval => use async/await to
 * ensure the database is started before proceeding.
 * Returns 0 if the service was already stopped.
 * Returns 1 if the service was stopped.
 * Returns the error if an error is thrown by the service stop facility.
 */

export async function shutdownDB(config: IConfig) {
  debug(modulename + ': running shutdownDB');

  /* create instances of logger and dumpError (singletons) */
  const { Logger } = config.LOGGER;
  const logger = Logger.getInstance(config);
  const { DumpError } = config.DUMPERROR;
  const dumpError = DumpError.getInstance(logger);

  try {
    const scQuery = await sc.query({
      name: 'mongoDB_27017',
    });

    if (scQuery[0].state.running) {
      /* experience suggests leaving a long break before trying to shut */
      await sleep(10000);
      await sc.stop('mongoDB_27017', {
        timeout: 5,
        waitForExit: true,
      });
      await sleep(10000);
      debug(modulename + ': mongoDB_27017 service was stopped');
      return 1;
    }

    debug(modulename + ': mongoDB_27017 service was already stopped');
    return 0;
  } catch (err) {
    logger.error(modulename + ': mongoDB shutdown error');
    err.message = 'mongod shutdown failure';
    dumpError(err);
    return err;
  }
}
