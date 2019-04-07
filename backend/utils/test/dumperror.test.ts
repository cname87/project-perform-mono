const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction = require('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/*
 * external dependencies
 */

/* set up mocha, sinon & chai */
import chai = require('chai');
import 'mocha';
import sinon = require('sinon');
import sinonChai = require('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* external dependencies */
import fs from 'fs';
import path = require('path');
import proxyquire = require('proxyquire');
import util = require('util');
const sleep = util.promisify(setTimeout);
import intercept = require('intercept-stdout');

/*
 * internal dependencies
 */

/* configuration file expected in application root directory */
import { IErr, loggerConfig } from '../src/configUtils';
const copyLoggerConfig = {
  LOGS_DIR: loggerConfig.LOGS_DIR,
  INFO_LOG: loggerConfig.INFO_LOG,
  ERROR_LOG: loggerConfig.ERROR_LOG,
};

/* paths for proxyquire */
const loggerPath = '../src/logger';
const dumpErrorPath = '../src/dumpError';

/*
 * tests
 */
describe('dumpError tests', () => {
  debug(`Running ${modulename}: describe - dumpError`);

  before('Set up', () => {
    debug(`Running ${modulename}: before - Set up`);

    /* set up env variable and test log files */
    loggerConfig.INFO_LOG = path.join(
      loggerConfig.LOGS_DIR,
      'dumpInfoTest.log',
    );
    loggerConfig.ERROR_LOG = path.join(
      loggerConfig.LOGS_DIR,
      'dumpErrorTest.log',
    );

    /* files only deleted when all hard links closed,
     * i.e. when programme closes */
    try {
      fs.unlinkSync(loggerConfig.INFO_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    try {
      fs.unlinkSync(loggerConfig.ERROR_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    /* create two empty files */
    fs.writeFileSync(loggerConfig.INFO_LOG, '');
    fs.writeFileSync(loggerConfig.ERROR_LOG, '');
  });

  after('Delete test log files & reset loggerConfig', () => {
    debug(
      `Running ${modulename}: after - Delete test log files & reset loggerConfig`,
    );

    /* files only deleted when all hard links closed,
     * i.e. when programme closes */
    try {
      fs.unlinkSync(loggerConfig.INFO_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    try {
      fs.unlinkSync(loggerConfig.ERROR_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    /* reset loggerConfig */
    loggerConfig.LOGS_DIR = copyLoggerConfig.LOGS_DIR;
    loggerConfig.INFO_LOG = copyLoggerConfig.INFO_LOG;
    loggerConfig.ERROR_LOG = copyLoggerConfig.ERROR_LOG;
  });

  it('should log to files and console.log', async function runTest() {
    debug(`Running ${modulename}: it - should log to files and console.log`);

    /* use proxyquire to reload Logger and DumpError */
    const { Logger } = proxyquire(loggerPath, {});
    const logger = Logger.getInstance();
    const { DumpError } = proxyquire(dumpErrorPath, {});
    const dumpError = DumpError.getInstance(logger);

    /* both log files should be empty */
    let infoLog = fs.readFileSync(loggerConfig.INFO_LOG).toString();
    let errorLog = fs.readFileSync(loggerConfig.ERROR_LOG).toString();
    expect(infoLog.length === 0, 'info log file to be empty').to.be.true;
    expect(errorLog.length === 0, 'error log file to be empty').to.be.true;

    /* start intercepting console.log */
    let capturedConsoleLog = '';
    let unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });

    /* dump an error */
    const err: IErr = new Error('Test error');
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
    infoLog = fs.readFileSync(loggerConfig.INFO_LOG).toString();
    errorLog = fs.readFileSync(loggerConfig.ERROR_LOG).toString();
    expect(infoLog.includes('Error Message'), 'error message printed').to.be
      .true;
    expect(errorLog.includes('Error Message'), 'error message printed').to.be
      .true;

    /* error name */

    /* test that error name logged to console.log */
    expect(capturedConsoleLog.includes('Error Name'), 'error name logged').to.be
      .true;

    /* error name dumped to both info and error logs */
    infoLog = fs.readFileSync(loggerConfig.INFO_LOG).toString();
    errorLog = fs.readFileSync(loggerConfig.ERROR_LOG).toString();
    expect(infoLog.includes('Error Name'), 'error name printed').to.be.true;
    expect(errorLog.includes('Error Name'), 'error name printed').to.be.true;

    /* error stack */

    /* test that error stack logged to console.log */
    expect(
      capturedConsoleLog.includes('Error Stacktrace'),
      'error stack logged',
    ).to.be.true;

    /* error stack dumped to both info and error logs */
    infoLog = fs.readFileSync(loggerConfig.INFO_LOG).toString();
    errorLog = fs.readFileSync(loggerConfig.ERROR_LOG).toString();
    expect(infoLog.includes('Error Stacktrace'), 'error stack printed').to.be
      .true;
    expect(errorLog.includes('Error Stacktrace'), 'error stack printed').to.be
      .true;

    /* clear and start intercepting console.log again */
    capturedConsoleLog = '';
    unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });

    /* dump the same error */
    dumpError(err);

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that info is not redumped */
    expect(
      capturedConsoleLog.includes('error already dumped'),
      'error not redumped',
    ).to.be.true;
    expect(capturedConsoleLog.includes('Error Message'), 'error not redumped')
      .to.be.false;

    /* test an error with no message, status */

    /* clear and start intercepting console.log again */
    capturedConsoleLog = '';
    unhookIntercept = intercept((txt: string) => {
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
    unhookIntercept = intercept((txt: string) => {
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
    unhookIntercept = intercept((txt: string) => {
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
    const dumpError = DumpError.getInstance();

    /* start intercepting console.log */
    let capturedConsoleError = '';
    const unhookIntercept = intercept(
      () => {
        // dummy function for console.log
      },
      (txt: string) => {
        capturedConsoleError += txt;
      },
    );

    /* dump an error */
    const err: IErr = new Error('Test error');
    err['statusCode'] = 100;
    err['dumped'] = false;
    dumpError(err);

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that error message logged to console.error */
    expect(
      capturedConsoleError.includes('Error Message'),
      'error message logged',
    ).to.be.true;
  });
});
