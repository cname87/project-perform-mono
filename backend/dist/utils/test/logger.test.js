"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debugFunction = require("debug");
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/* set up mocha, sinon & chai */
const chai = require("chai");
require("mocha");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
    prefix: '',
});
/* external dependencies */
const fs_1 = tslib_1.__importDefault(require("fs"));
const path = require("path");
const proxyquireObject = require("proxyquire");
const proxyquire = proxyquireObject.noPreserveCache();
const util = require("util");
const sleep = util.promisify(setTimeout);
const intercept = require("intercept-stdout");
/* configuration file expected in application root directory */
const configUtils_1 = require("../src/configUtils");
/* set up array to hold all files opened for later closure if a test fails */
const filesOpened = [];
/* set up path to logger.ts for proxyquire */
const loggerPath = '../src/logger';
describe('logger', () => {
    debug(`Running ${modulename}: describe - logger`);
    /**
     *  Set up and returns test log message detail.
     */
    function setupMessage(message) {
        const logMessage = message;
        const expectedLogged = message + '\r\n';
        const logTail = expectedLogged.length;
        return {
            logMessage,
            expectedLogged,
            logTail,
        };
    }
    /**
     * Function to set up new temporary test log files in the logs directory.
     * @params
     * - infoFileName: info log file name to be created.
     * - errorFileName: error log file name to be created.
     * @returns A new logger instance using newly created files in the configured logger directory.
     * @throws An error if the either file already exists in the configured logs directory.  The files should not exist as logger creation will fail on deleted files as deleted files are not truly deleted until all hard links are closed i.e. the program exits.
     */
    function setupLoggerAndFiles(infoFileName, errorFile) {
        debug(modulename + ': running setupFiles');
        /* create temporary log files paths */
        const infoFilePath = path.join(configUtils_1.loggerConfig.LOGS_DIR, infoFileName);
        const errorFilePath = path.join(configUtils_1.loggerConfig.LOGS_DIR, errorFile);
        /* push onto an array of files that is deleted even if a test fails */
        filesOpened.push(infoFilePath);
        filesOpened.push(errorFilePath);
        /* Note: The files should not exist as logger creation will fail on deleted files as deleted files are not truly deleted until the program exits */
        /* tests whether a file exists */
        function isFileExist(file) {
            try {
                fs_1.default.unlinkSync(file);
            }
            catch (err) {
                /* file didn't exist */
                return false;
            }
            /* file existed and was deleted */
            return true;
        }
        /* error if either file already existed */
        expect(isFileExist(infoFilePath)).to.be.false;
        expect(isFileExist(errorFilePath)).to.be.false;
        /* use proxyquire to reload Logger */
        const { Logger } = proxyquire(loggerPath, {});
        /* create logger with new test log files */
        const logger = new Logger(infoFilePath, errorFilePath);
        /* both log files should be empty */
        expect(fs_1.default.readFileSync(infoFilePath).toString().length === 0, 'info log file to be empty').to.be.true;
        expect(fs_1.default.readFileSync(errorFilePath).toString().length === 0, 'error log file to be empty').to.be.true;
        return { logger, infoFilePath, errorFilePath };
    }
    /**
     * Function to delete a file if it exists.
     * @params filepath: The path to file to be deleted.
     * @returns Void
     * Note: The file is only deleted when all hard links are closed, i.e. when programme closes.
     */
    function deleteFile(filePath) {
        /* files only deleted when all hard links closed,
         * i.e. when programme closes */
        try {
            fs_1.default.unlinkSync(filePath);
        }
        catch (err) {
            /* ok - file didn't exist */
        }
    }
    after('Delete test log files & reset loggerConfig', () => {
        debug(`Running ${modulename}: after - Delete test log files`);
        /* in case any files not deleted due to test case failure */
        for (const file of filesOpened) {
            deleteFile(file);
        }
    });
    it('logs to standard files', async () => {
        debug(`Running ${modulename}: it - logs to the standard files`);
        /* read standard log file paths */
        const infoLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, configUtils_1.loggerConfig.INFO_LOG);
        const errorLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, configUtils_1.loggerConfig.ERROR_LOG);
        /* use proxyquire to reload Logger */
        const { Logger } = proxyquire(loggerPath, {});
        const logger = new Logger();
        const { logMessage, expectedLogged, logTail } = setupMessage('TEST_LOG_ERROR');
        /* log at error level */
        logger.error(logMessage);
        /* allow logger print to file */
        await sleep(100);
        /* read tail of both log files */
        const infoLogged = fs_1.default
            .readFileSync(infoLog)
            .toString()
            .slice(-logTail);
        const errorLogged = fs_1.default
            .readFileSync(errorLog)
            .toString()
            .slice(-logTail);
        /* Note: will fail if log files roll over to <name>1.log when full */
        expect(infoLogged === expectedLogged, 'info log file addition').to.be.true;
        expect(errorLogged === expectedLogged, 'error log file addition').to.be
            .true;
    });
    it('creates and logs to files (development)', async () => {
        debug(`Running ${modulename}: it - creates and logs to files (development)`);
        /* set environment to 'development' */
        const restoreEnv = process.env;
        process.env.NODE_ENV = 'development';
        /* unique name for files */
        const infoFile = 'testInfoDev1';
        const errorFile = 'testErrorDev1';
        debug('set up logger instance and create test log files');
        const { logger, infoFilePath, errorFilePath } = setupLoggerAndFiles(infoFile, errorFile);
        /* start intercepting console.log */
        /* Note: no debug messages until intercept is closed */
        let capturedConsoleLog = '';
        const unhookIntercept = intercept((txt) => {
            capturedConsoleLog += txt;
        });
        /* create test log message */
        const { logMessage: logMessage1, expectedLogged: expectedLogged1, logTail: logTail1, } = setupMessage('TEST_LOG_ERROR1');
        /* log a message at the info level */
        logger.info(logMessage1);
        /* stop intercepting console.log */
        unhookIntercept();
        /* test that it logged test message to console.log */
        expect(capturedConsoleLog.includes(logMessage1), 'console.log output includes test message').to.be.true;
        /* allow logger print to file */
        await sleep(100);
        /* only info log should have output */
        let infoLogged = fs_1.default
            .readFileSync(infoFilePath)
            .toString()
            .slice(-logTail1);
        let errorLogged = fs_1.default
            .readFileSync(errorFilePath)
            .toString()
            .slice(-logTail1);
        expect(infoLogged === expectedLogged1, 'info log file to have an entry').to
            .be.true;
        expect(errorLogged.length === 0, 'error log file to be empty').to.be.true;
        /* create test log message */
        const { logMessage: logMessage2, expectedLogged: expectedLogged2, logTail: logTail2, } = setupMessage('TEST_LOG_ERROR2');
        /* log a message at the error level */
        logger.error(logMessage2);
        /* allow logger print to file */
        await sleep(100);
        /* info log has extra output, and error log has output */
        infoLogged = fs_1.default
            .readFileSync(infoFilePath)
            .toString()
            .slice(-logTail2);
        errorLogged = fs_1.default
            .readFileSync(errorFilePath)
            .toString()
            .slice(-logTail2);
        expect(infoLogged === expectedLogged2, 'info log file addition').to.be.true;
        expect(errorLogged === expectedLogged2, 'error log file entry').to.be.true;
        debug('deleting test files');
        deleteFile(infoFilePath);
        deleteFile(errorFilePath);
        /* restore process.env */
        process.env = restoreEnv;
    });
    it('logs to existing files (production)', async () => {
        debug(`Running ${modulename}: it - logs to existing files (production)`);
        /* set environment to 'production' */
        const restoreEnv = process.env;
        process.env.NODE_ENV = 'production';
        /* unique name for files */
        const infoFile = 'testInfoProd1';
        const errorFile = 'testErrorProd1';
        debug('set up logger instance and create test log files');
        const { logger, infoFilePath, errorFilePath } = setupLoggerAndFiles(infoFile, errorFile);
        /* start intercepting console.log*/
        /* Note: no debug messages until intercept is closed */
        let capturedConsoleLog = '';
        const unhookIntercept = intercept((txt) => {
            capturedConsoleLog += txt;
        });
        /* create test log message */
        const { logMessage: logMessage1, expectedLogged: expectedLogged1, logTail: logTail1, } = setupMessage('TEST_LOG_ERROR1');
        /* log a message at the info level */
        logger.info(logMessage1);
        /* stop intercepting console.log */
        unhookIntercept();
        /* test that it didn't log to console.log */
        expect(capturedConsoleLog === '', 'no console.log output').to.be.true;
        /* allow logger print to file */
        await sleep(100);
        /* only info log should have output */
        let infoLogged = fs_1.default
            .readFileSync(infoFilePath)
            .toString()
            .slice(-logTail1);
        let errorLogged = fs_1.default
            .readFileSync(errorFilePath)
            .toString()
            .slice(-logTail1);
        expect(infoLogged === expectedLogged1, 'info log file to have an entry').to
            .be.true;
        expect(errorLogged.length === 0, 'error log file to be empty').to.be.true;
        /* create test log message */
        const { logMessage: logMessage2, expectedLogged: expectedLogged2, logTail: logTail2, } = setupMessage('TEST_LOG_ERROR2');
        /* log a message at the error level */
        logger.error(logMessage2);
        /* allow logger print to file */
        await sleep(100);
        /* info log has extra output, and error log has output */
        infoLogged = fs_1.default
            .readFileSync(infoFilePath)
            .toString()
            .slice(-logTail2);
        errorLogged = fs_1.default
            .readFileSync(errorFilePath)
            .toString()
            .slice(-logTail2);
        expect(infoLogged === expectedLogged2, 'info log file addition').to.be.true;
        expect(errorLogged === expectedLogged2, 'error log file entry').to.be.true;
        debug('deleting test files');
        deleteFile(infoFilePath);
        deleteFile(errorFilePath);
        /* restore process.env */
        process.env = restoreEnv;
    });
    it('should test fs writeFileSync throwing an unexpected error', async function runTest() {
        debug(`Running ${modulename}: it - should test fs writeFileSync throwing an unexpected error`);
        /* set up a dummy test log file path */
        const testInfoFail = path.join(configUtils_1.loggerConfig.LOGS_DIR, 'testInfoFail.log');
        filesOpened.push(testInfoFail);
        /* create a new logger stubbing fs.writeFileSync
         * - will fail on the info log writeFileSync */
        try {
            const { Logger } = proxyquire(loggerPath, {
                fs: {
                    writeFileSync: (file, text, flag) => {
                        if (file === testInfoFail) {
                            throw new Error('Test error');
                        }
                        else {
                            fs_1.default.writeFileSync(file, text, flag);
                        }
                    },
                },
            });
            /* try create a new logger */
            const logger = new Logger(testInfoFail);
            util.inspect(logger);
            /* fail as should not have reached here */
            expect.fail(true, false, 'Should not reach here');
        }
        catch (err) {
            /* test that the test error was thrown */
            expect(err.message === 'Test error', 'logger creation fail').to.be.true;
        }
    });
});
//# sourceMappingURL=logger.test.js.map