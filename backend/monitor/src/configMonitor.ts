/**
 * This section sets all configuration parameters for the monitor
 * module that implements monitoring of an executable using the
 * forever package.
 * The monitor module is self-contained i.e. it is not dependent on
 * anything other than a path to this file, which includes the path
 * to the monitored executable.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import appRootObject = require('app-root-path');
/* appRoot will be the directory containing the node_modules directory which includes app-root-path, i.e. should be in .../backend */
const appRoot = appRootObject.toString();
import path = require('path');
import forever = require('forever-monitor');

// a configured winston general logger
import { Logger } from '../../utils/src/logger';
/* a utility to dump errors to the logger */
import { DumpError } from '../../utils/src/dumpError';

export const config = {
  /**
   * This section sets up imports for all the internal modules.
   */
  Logger,
  DumpError,

  /* The path to the executable js file */
  EXEC_JS: path.join(appRoot, process.env.EXEC_JS as string),
  /* maximum number of child starts triggered by forever */
  MAX_STARTS: 10,
  /* true for forever to restart child when files change /*
  /* *** Not recommended as not well supported *** */
  WATCH_FILES: false,
  /* directory to be watched by forever */
  WATCH_DIR: appRoot,
  /* true for forever to start node executable in debug mode */
  get IS_MONITOR_DEBUG() {
    return process.env.NODE_ENV === 'development' ? true : false;
  },
  /* The logs directory referenced in the various log files
   * must exist. */
  /* forever log when run as a daemon */
  MONITOR_FOREVER_LOG: path.join(
    appRoot,
    process.env.LOGS_DIR as string,
    'monitorForever.log',
  ),
  /* child stdout log */
  MONITOR_OUT_LOG: path.join(
    appRoot,
    process.env.LOGS_DIR as string,
    'monitorOut.log',
  ),
  /* child stderr log */
  MONITOR_ERR_LOG: path.join(
    appRoot,
    process.env.LOGS_DIR as string,
    'monitorErr.log',
  ),
};

export interface IChild extends forever.Monitor {
  running: boolean;
  exitCode: number;
}
export interface IMonitor extends forever.Monitor {
  child: IChild;
}

export interface IMonitorIndex {
  child: IChild;
  exit: (signal: string) => void;
  runMonitor: () => Promise<void>;
  uncaughtException: (err: any) => Promise<void>;
  unhandledRejection: (reason: any, promise: any) => Promise<void>;
  debug: (text: string) => void;
  logger: { error: (err: any) => void };
  dumpError: (err: any) => void;
}
