const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction = require('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

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
import proxyquireObject = require('proxyquire');
const proxyquire = proxyquireObject.noPreserveCache();
import util = require('util');
const sleep = util.promisify(setTimeout);
import intercept = require('intercept-stdout');
import * as winston from 'winston';

/*
 * internal dependencies
 */

/* configuration file expected in application root directory */
import { IErr, loggerConfig } from '../src/configUtils';

/* set up test log files */
const infoLog = path.join(loggerConfig.LOGS_DIR, 'dumpInfoTest.log');
const errorLog = path.join(loggerConfig.LOGS_DIR, 'dumpErrorTest.log');

/* paths for proxyquire */
const loggerPath = '../src/logger';
const dumpErrorPath = '../src/dumpError';

describe('dumpError tests', () => {
  debug(`Running ${modulename}: describe - dumpError`);

  after('Delete test log files', () => {
    debug(`Running ${modulename}: after - Delete test log files`);

    /* delete files */
    try {
      fs.unlinkSync(infoLog);
    } catch (err) {
      /* ok - file didn't exist */
    }

    try {
      fs.unlinkSync(errorLog);
    } catch (err) {
      /* ok - file didn't exist */
    }
  });

  it('should log to files and console.log', async function runTest() {
    debug(`Running ${modulename}: it - should log to files and console.log`);

    /* use proxyquire to reload Logger and DumpError */
    const { Logger } = proxyquire(loggerPath, {});
    const logger = new Logger(infoLog, errorLog) as winston.Logger;
    const { DumpError } = proxyquire(dumpErrorPath, {});
    const dumpError = new DumpError(logger) as (err: any) => void;

    /* both log files should be empty */
    let infoLogged = fs.readFileSync(infoLog).toString();
    let errorLogged = fs.readFileSync(errorLog).toString();
    expect(infoLogged.length === 0, 'info log file to be empty').to.be.true;
    expect(errorLogged.length === 0, 'error log file to be empty').to.be.true;

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
    infoLogged = fs.readFileSync(infoLog).toString();
    errorLogged = fs.readFileSync(errorLog).toString();
    expect(infoLogged.includes('Error Message'), 'error message printed').to.be
      .true;
    expect(errorLogged.includes('Error Message'), 'error message printed').to.be
      .true;

    /* error name */

    /* test that error name logged to console.log */
    expect(capturedConsoleLog.includes('Error Name'), 'error name logged').to.be
      .true;

    /* error name dumped to both info and error logs */
    infoLogged = fs.readFileSync(infoLog).toString();
    errorLogged = fs.readFileSync(errorLog).toString();
    expect(infoLogged.includes('Error Name'), 'error name printed').to.be.true;
    expect(errorLogged.includes('Error Name'), 'error name printed').to.be.true;

    /* error stack */

    /* test that error stack logged to console.log */
    expect(
      capturedConsoleLog.includes('Error Stacktrace'),
      'error stack logged',
    ).to.be.true;

    /* error stack dumped to both info and error logs */
    infoLogged = fs.readFileSync(infoLog).toString();
    errorLogged = fs.readFileSync(errorLog).toString();
    expect(infoLogged.includes('Error Stacktrace'), 'error stack printed').to.be
      .true;
    expect(errorLogged.includes('Error Stacktrace'), 'error stack printed').to
      .be.true;

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
    const dumpError = new DumpError() as (err: any) => void;

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
