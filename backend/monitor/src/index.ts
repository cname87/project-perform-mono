/*
 * This module starts a js file at a location defined in the configuration
 * file as a child process and restarts it if it should crash for any reason.
 * The maximum number of restarts can be set in the configuration file.
 * The child process and this process can be stopped via a 'SIGINT'
 * signal (e.g. via CTRL + C).
 * Refer to the configuration file, that must be named configMonitor.js and
 * be in the same directory as this one, for configuration details.
 *
 * Note: monitor can also trigger a restart if any files in a watched directory
 * change if so configured.  Files defined in a .foreverignore file
 * (which must be in the watched directory) are ignored.  (You must ignore
 * log files in the watched directory that might be updated by monitor as such
 * updates would trigger a loop.  When using watch, it appears that
 * monitor will only exit with a process.exit.  This means that the mocha test
 * file must be started with the watch functionality disabled.
 */

/* import configuration parameters into process.env */
/* the .env file must be in process.cwd() */
import dotenv = require('dotenv');
dotenv.config();

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* configuration file expected in directory above */
import { config, IChild, IMonitor } from './configMonitor';
export { config };

/* external dependencies */
import forever = require('forever-monitor');
import winston = require('winston');

/* create instances of logger and dumpError for monitor
 * Note: the same logger will be used by index and all other module */
debug(modulename + ': loading loggers');
const Logger = config.Logger;
export const logger = new Logger() as winston.Logger;
const DumpError = config.DumpError;
export const dumpError = new DumpError(logger) as (err: any) => void;

/* child process will be index.js */

let child: IChild;

/* tells child process to close */
function exit(cause: string) {
  /* remove all listeners so process exits */
  process.removeListener('SIGINT', exit);
  process.removeListener('uncaughtException', uncaughtException);
  process.removeListener('unhandledRejection', unhandledRejection);

  if (child && child.running) {
    debug(modulename + `: exiting due to: ${cause}`);
    child.send({
      action: 'close',
      code: '31017',
    });
  } else {
    logger.error(
      modulename + `: exiting due to: ${cause} ` + '- child not running',
    );
    process.exit(1);
  }
}

async function uncaughtException(err: any) {
  debug(modulename + ': running uncaughtException');

  exit('uncaught exception');
  dumpError(err);
  process.exit(1);
}

async function unhandledRejection(reason: any, promise: any) {
  debug(modulename + ': running unhandledRejection');

  logger.error(
    modulename +
      ': unhandled promise rejection\n' +
      'At: ' +
      promise +
      '\n' +
      'Reason: ' +
      reason,
  );
  exit('unhandled rejection');
  process.exit(1);
}

/* start monitor */
async function runMonitor(): Promise<void> {
  logger.info('\n*** STARTING MONITOR ***\n');

  /* forever start options */
  const options = {
    /* required to communicate with child process */
    fork: true,
    /* sets the maximum number of times child should be started
     * including restarts after an error.
     * set to 0 or 1 to disable restart on child error */
    max: config.MAX_STARTS,
    /* kills the entire child process tree on exit */
    killTree: true,
    /* silences the output from stdout and stderr in the parent process */
    silent: false,
    /* minimum time a child process has to be up
     * Forever will 'exit' otherwise */
    minUptime: 2000,
    /* interval between restarts if a child is spinning
     * (i.e. alive < minUptime) */
    spinSleepTime: 1000,
    /* set true to restart on file changes */
    watch: config.WATCH_FILES,
    /* whether to ignore files starting with a '.' */
    watchIgnoreDotFiles: true,
    /* ignore glob patterns when watching for changes
     * this setting appears to be ignored
     * you need .foreverignore in project directory
     * see .foreverignore for further information
     */
    watchIgnorePatterns: [],
    /* top-level directory to watch from - must be specified */
    watchDirectory: config.WATCH_DIR,
    /* append to logs */
    append: false,
    /* path to log output from forever process (when daemonized) */
    logFile: config.MONITOR_FOREVER_LOG,
    /* path to log output from child stdout */
    outFile: config.MONITOR_OUT_LOG,
    /* path to log output from child stderr */
    /* note that debug output is sent to this file */
    errFile: config.MONITOR_ERR_LOG,
  };

  /* option for forever to start node with or without debug mode */
  const startDebug: string[] = config.IS_MONITOR_DEBUG
    ? ['node', '--inspect', config.EXEC_JS, '--color']
    : ['node', config.EXEC_JS];

  child = forever.start(startDebug, options) as IChild;

  /* set up handler for CTRL+C */
  process.on('SIGINT', exit);

  /* capture all uncaught application exceptions */
  process.on('uncaughtException', uncaughtException);

  /* throw an error on an unhandled promise rejection */
  process.on('unhandledRejection', unhandledRejection);

  /* receive confirmation from the child server */
  child.on('message', (msg: string) => {
    debug(modulename + `: Monitor received confirmation: ${msg}`);
  });

  /* track restarts */
  let restarts = 0;
  const maxRestarts = config.MAX_STARTS - 1;

  /* process.exit in child causes child to first emit an 'exit:code'
   * event during its 'exit' event handling routine */
  child.on('exit:code', (code: number) => {
    if (code === 31017) {
      /* controlled exit */
      /* stop the child so it doesn't restart
       * this results in the child emitting an 'exit' event */
      child.stop();
      debug(modulename + ': stopped child process');
    } else {
      logger.error(
        modulename +
          ': unexpected child code received: ' +
          `${code}' - allowing restart (if max tries not exceeded)`,
      );

      if (restarts >= maxRestarts) {
        debug(
          modulename +
            ': not restarting - restarted already ' +
            restarts +
            ' times of ' +
            maxRestarts +
            ' maximum',
        );
      }
    }
  });

  /* 'exit' emitted after child.stop */
  child.on('exit', (Monitor: IMonitor) => {
    child.removeAllListeners();
    debug(
      modulename + ': child exited with code ' + `'${Monitor.child.exitCode}'`,
    );

    if (config.WATCH_FILES === true) {
      /* need to force process.exit when watch enabled */
      debug(modulename + ': calling process.exit as watch enabled');

      logger.info('\n*** EXITING MONITOR ***\n');

      process.exit(0);
    }

    logger.info('\n*** EXITING MONITOR ***\n');
  });

  /* emitted on every restart */
  child.on('restart', () => {
    restarts++;
    debug(
      modulename +
        ': forever restarting script - restart number: ' +
        restarts +
        ' of ' +
        maxRestarts,
    );

    logger.error('\n*** MONITOR RESTARTING CHILD ***\n');
  });

  /* only watch restarts emit this event */
  child.on('watch:restart', (info) => {
    debug(
      modulename +
        ': forever restarting script because ' +
        info.stat +
        ' changed',
    );
  });
}

runMonitor();

/* all exports are for unit test */
export { child, exit, runMonitor, uncaughtException, unhandledRejection };
