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
/*
 * internal dependencies
 */
/* configuration file expected in application root directory */
const configUtils_1 = require("../src/configUtils");
/* set up test log files */
const infoLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, 'dumpInfoTest.log');
const errorLog = path.join(configUtils_1.loggerConfig.LOGS_DIR, 'dumpErrorTest.log');
/* paths for proxyquire */
const loggerPath = '../src/logger';
const dumpErrorPath = '../src/dumpError';
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
describe('dumpError tests', () => {
    debug(`Running ${modulename}: describe - dumpError`);
    after('Delete test log files', () => {
        debug(`Running ${modulename}: after - Delete test log files`);
        /* delete files */
        deleteFile(infoLog);
        deleteFile(errorLog);
    });
    it('should log to files and console.log', async function runTest() {
        debug(`Running ${modulename}: it - should log to files and console.log`);
        /* delete files in case they exist following an aborted test run*/
        deleteFile(infoLog);
        deleteFile(errorLog);
        /* use proxyquire to reload Logger and DumpError */
        const { Logger } = proxyquire(loggerPath, {});
        const logger = new Logger(infoLog, errorLog);
        const { DumpError } = proxyquire(dumpErrorPath, {});
        const dumpError = new DumpError(logger);
        /* both log files should be empty */
        let infoLogged = fs_1.default.readFileSync(infoLog).toString();
        let errorLogged = fs_1.default.readFileSync(errorLog).toString();
        expect(infoLogged.length === 0, 'info log file to be empty').to.be.true;
        expect(errorLogged.length === 0, 'error log file to be empty').to.be.true;
        /* start intercepting console.log */
        let capturedConsoleLog = '';
        let unhookIntercept = intercept((txt) => {
            capturedConsoleLog += txt;
        });
        /* dump an error */
        const err = new Error('Test error');
        err['statusCode'] = 100;
        err['dumped'] = false;
        dumpError(err);
        /* stop intercepting console.log */
        unhookIntercept();
        /* allow logger print to file */
        await sleep(100);
        /* error message */
        /* test that error message logged to console.log */
        expect(capturedConsoleLog.includes('Error Message'), 'error message logged')
            .to.be.true;
        /* error message dumped to both info and error logs */
        infoLogged = fs_1.default.readFileSync(infoLog).toString();
        errorLogged = fs_1.default.readFileSync(errorLog).toString();
        expect(infoLogged.includes('Error Message'), 'error message printed').to.be
            .true;
        expect(errorLogged.includes('Error Message'), 'error message printed').to.be
            .true;
        /* error name */
        /* test that error name logged to console.log */
        expect(capturedConsoleLog.includes('Error Name'), 'error name logged').to.be
            .true;
        /* error name dumped to both info and error logs */
        infoLogged = fs_1.default.readFileSync(infoLog).toString();
        errorLogged = fs_1.default.readFileSync(errorLog).toString();
        expect(infoLogged.includes('Error Name'), 'error name printed').to.be.true;
        expect(errorLogged.includes('Error Name'), 'error name printed').to.be.true;
        /* error stack */
        /* test that error stack logged to console.log */
        expect(capturedConsoleLog.includes('Error Stacktrace'), 'error stack logged').to.be.true;
        /* error stack dumped to both info and error logs */
        infoLogged = fs_1.default.readFileSync(infoLog).toString();
        errorLogged = fs_1.default.readFileSync(errorLog).toString();
        expect(infoLogged.includes('Error Stacktrace'), 'error stack printed').to.be
            .true;
        expect(errorLogged.includes('Error Stacktrace'), 'error stack printed').to
            .be.true;
        /* clear and start intercepting console.log again */
        capturedConsoleLog = '';
        unhookIntercept = intercept((txt) => {
            capturedConsoleLog += txt;
        });
        /* dump the same error */
        dumpError(err);
        /* stop intercepting console.log */
        unhookIntercept();
        /* test that info is not redumped */
        /* note: cannot test dumpError debug messages are included in console.log as debug messages are not sent to concole when Istanbul used.*/
        expect(capturedConsoleLog.includes('Error Message'), 'error not redumped')
            .to.be.false;
        /* test an error with no message, status */
        /* clear and start intercepting console.log again */
        capturedConsoleLog = '';
        unhookIntercept = intercept((txt) => {
            capturedConsoleLog += txt;
        });
        /* dump a new error */
        const err2 = new Error('');
        err2.stack = undefined;
        dumpError(err2);
        /* stop intercepting console.log */
        unhookIntercept();
        /* test that info is not redumped */
        expect(capturedConsoleLog.includes('Error Message'), 'no error message').to
            .be.false;
        expect(capturedConsoleLog.includes('Error Stack'), 'no error stack').to.be
            .false;
        /* test an error string */
        /* clear and start intercepting console.log again */
        capturedConsoleLog = '';
        unhookIntercept = intercept((txt) => {
            capturedConsoleLog += txt;
        });
        /* dump a string as error */
        dumpError('Test string');
        /* stop intercepting console.log */
        unhookIntercept();
        /* test that info is not redumped */
        expect(capturedConsoleLog.includes('Error String'), 'string dumped').to.be
            .true;
        /* test an null error */
        /* clear and start intercepting console.log again */
        capturedConsoleLog = '';
        unhookIntercept = intercept((txt) => {
            capturedConsoleLog += txt;
        });
        /* dump null as error */
        dumpError(null);
        /* stop intercepting console.log */
        unhookIntercept();
        /* test that info is not redumped */
        expect(capturedConsoleLog.includes('err is null'), 'null warning').to.be
            .true;
    });
    it('should log to console.error and console.log', async function runTest() {
        debug(`Running ${modulename}: it - should log to files and console.log`);
        /* use proxyquire to reload DumpError */
        const { DumpError } = proxyquire(dumpErrorPath, {});
        /* don't pass logger to dumpError */
        const dumpError = new DumpError();
        /* start intercepting console.log */
        let capturedConsoleError = '';
        const unhookIntercept = intercept(() => {
            // dummy function for console.log
        }, (txt) => {
            capturedConsoleError += txt;
        });
        /* dump an error */
        const err = new Error('Test error');
        err['statusCode'] = 100;
        err['dumped'] = false;
        dumpError(err);
        /* stop intercepting console.log */
        unhookIntercept();
        /* test that error message logged to console.error */
        expect(capturedConsoleError.includes('Error Message'), 'error message logged').to.be.true;
    });
});
//# sourceMappingURL=dumperror.test.js.map