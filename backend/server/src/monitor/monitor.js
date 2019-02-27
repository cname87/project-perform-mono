"use strict";
/*
 * This module starts a js file at a location defined in the configuration
 * file as a child process and restarts it if it should crash for any reason.
 * The maximum number of restarts can be set in the configuration file.
 * The child process and this process can be stopped via a 'SIGINT'
 * signal (e.g. via CTRL + C).
 * Refer to the configuration file, that must be named config.js and
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
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
exports.debug = debug_1.default('PP_' + modulename);
exports.debug(`Starting ${modulename}`);
/* configuration file expected in directory above */
const _config_1 = require("../.config");
exports.config = _config_1.config;
/* external dependencies */
const forever = tslib_1.__importStar(require("forever-monitor"));
/* create instances of logger and dumpError for monitor
 * Note: the same logger will be used by index and all other module */
exports.debug(modulename + ': loading loggers');
const { Logger } = _config_1.config.LOGGER;
exports.logger = Logger.getInstance(_config_1.config);
const { DumpError } = _config_1.config.DUMPERROR;
exports.dumpError = DumpError.getInstance(exports.logger);
/* tells child process to close */
function exit(cause) {
    /* remove all listeners so process exits */
    process.removeListener('SIGINT', exit);
    process.removeListener('uncaughtException', uncaughtException);
    process.removeListener('unhandledRejection', unhandledRejection);
    if (exports.child && exports.child.running) {
        exports.debug(modulename + `: exiting due to: ${cause}`);
        exports.child.send({
            action: 'close',
            code: '31017',
        });
    }
    else {
        exports.logger.error(modulename + `: exiting due to: ${cause} ` + '- child not running');
        process.exit(1);
    }
}
exports.testExit = exit;
async function uncaughtException(err) {
    exports.debug(modulename + ': running uncaughtException');
    exit('uncaught exception');
    exports.dumpError(err);
    process.exit(1);
}
exports.testUncaughtException = uncaughtException;
async function unhandledRejection(reason, promise) {
    exports.debug(modulename + ': running unhandledRejection');
    exports.logger.error(modulename +
        ': unhandled promise rejection\n' +
        'At: ' +
        promise +
        '\n' +
        'Reason: ' +
        reason);
    exit('unhandled rejection');
    process.exit(1);
}
exports.testUnhandledRejection = unhandledRejection;
/* start monitor */
async function start() {
    exports.logger.info('\n*** STARTING MONITOR ***\n');
    /* forever start options */
    // tslint:disable:object-literal-sort-keys
    const options = {
        /* required to communicate with child process */
        fork: true,
        /* sets the maximum number of times child should be started
         * including restarts after an error.
         * set to 0 or 1 to disable restart on child error */
        max: _config_1.config.MAX_STARTS,
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
        watch: _config_1.config.WATCH_FILES,
        /* whether to ignore files starting with a '.' */
        watchIgnoreDotFiles: true,
        /* ignore glob patterns when watching for changes
         * this setting appears to be ignored
         * you need .foreverignore in project directory
         * see .foreverignore for further information
         */
        watchIgnorePatterns: [],
        /* top-level directory to watch from - must be specified */
        watchDirectory: _config_1.config.WATCH_DIR,
        /* append to logs */
        append: false,
        /* path to log output from forever process (when daemonized) */
        logFile: _config_1.config.MONITOR_FOREVER_LOG,
        /* path to log output from child stdout */
        outFile: _config_1.config.MONITOR_OUT_LOG,
        /* path to log output from child stderr */
        /* note that debug output is sent to this file */
        errFile: _config_1.config.MONITOR_ERR_LOG,
    };
    /* option for forever to start node with or without debug mode */
    const startDebug = _config_1.config.IS_MONITOR_DEBUG
        ? ['node', '--inspect', _config_1.config.EXEC_JS, '--color']
        : ['node', _config_1.config.EXEC_JS];
    exports.child = forever.start(startDebug, options);
    /* set up handler for CTRL+C */
    process.on('SIGINT', exit);
    /* capture all uncaught application exceptions */
    process.on('uncaughtException', uncaughtException);
    /* throw an error on an unhandled promise rejection */
    process.on('unhandledRejection', unhandledRejection);
    /* receive confirmation from the child server */
    exports.child.on('message', (msg) => {
        exports.debug(modulename + `: Monitor received confirmation: ${msg}`);
    });
    /* track restarts */
    let restarts = 0;
    const maxRestarts = _config_1.config.MAX_STARTS - 1;
    /* process.exit in child causes child to first emit an 'exit:code'
     * event during its 'exit' event handling routine */
    exports.child.on('exit:code', (code) => {
        if (code === 31017) {
            /* controlled exit */
            /* stop the child so it doesn't restart
             * this results in the child emitting an 'exit' event */
            exports.child.stop();
            exports.debug(modulename + ': stopped child process');
        }
        else {
            exports.logger.error(modulename +
                ': unexpected child code received: ' +
                `${code}' - allowing restart (if max tries not exceeded)`);
            if (restarts >= maxRestarts) {
                exports.debug(modulename +
                    ': not restarting - restarted already ' +
                    restarts +
                    ' times of ' +
                    maxRestarts +
                    ' maximum');
            }
        }
    });
    /* 'exit' emitted after child.stop */
    exports.child.on('exit', (Monitor) => {
        exports.child.removeAllListeners();
        exports.debug(modulename + ': child exited with code ' + `'${Monitor.child.exitCode}'`);
        if (_config_1.config.WATCH_FILES === true) {
            /* need to force process.exit when watch enabled */
            exports.debug(modulename + ': calling process.exit as watch enabled');
            exports.logger.info('\n*** EXITING MONITOR ***\n');
            process.exit(0);
        }
        exports.logger.info('\n*** EXITING MONITOR ***\n');
    });
    /* emitted on every restart */
    exports.child.on('restart', () => {
        restarts++;
        exports.debug(modulename +
            ': forever restarting script - restart number: ' +
            restarts +
            ' of ' +
            maxRestarts);
        exports.logger.error('\n*** MONITOR RESTARTING CHILD ***\n');
    });
    /* only watch restarts emit this event */
    exports.child.on('watch:restart', (info) => {
        exports.debug(modulename +
            ': forever restarting script because ' +
            info.stat +
            ' changed');
    });
}
exports.testStart = start;
start();
//# sourceMappingURL=monitor.js.map