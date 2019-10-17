import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
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
import proxyquireObject = require('proxyquire');
const proxyquire = proxyquireObject.noPreserveCache();
import util = require('util');
const sleep = util.promisify(setTimeout);
import intercept = require('intercept-stdout');
import winston = require('winston');

/*
 * internal dependencies
 */

/* configuration file expected in application root directory */
import { IErr } from '../src/configUtils';

/* paths for proxyquire */
const loggerPath = '../src/logger';
const dumpErrorPath = '../src/dumpError';

describe('dumpError tests', () => {
  debug(`Running ${modulename}: describe - dumpError`);

  it('should log to files and console.log', async function runTest() {
    debug(`Running ${modulename}: it - should log to files and console.log`);

    /* use proxyquire to reload Logger and DumpError */
    const { Logger } = proxyquire(loggerPath, {});
    const logger = new Logger() as winston.Logger;
    const { DumpError } = proxyquire(dumpErrorPath, {});
    const dumpError = new DumpError(logger) as (err: any) => void;

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

    /* test that error name logged to console.log */
    expect(capturedConsoleLog.includes('Error Name'), 'error name logged').to.be
      .true;

    /* test that error stack logged to console.log */
    expect(
      capturedConsoleLog.includes('Error Stacktrace'),
      'error stack logged',
    ).to.be.true;

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
    /* note: cannot test dumpError debug messages are included in console.log as debug messages are not sent to concole when Istanbul used.*/
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
