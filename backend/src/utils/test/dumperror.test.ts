import { setupDebug } from '../../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* external dependencies */
import proxyquire from 'proxyquire';
import intercept from 'intercept-stdout';
import winston from 'winston';

/* paths for proxyquire */
const loggerPath = '../src/logger';
const dumpErrorPath = '../src/dumpError';

describe('dumpError tests', () => {
  debug(`Running ${modulename}: describe - dumpError`);

  it('should log to console.log', async function runTest() {
    debug(`Running ${modulename}: it - should log to console.log`);

    /* a logger is passed but since the environment is 'development' it only logs to stdout (with logger formatting) and not the GCP stackdriver.  It does not log to stderr */

    /* use proxyquire to reload Logger and DumpError */
    const { Logger } = proxyquire(loggerPath, {});
    const logger = new Logger() as winston.Logger;
    const { DumpError } = proxyquire(dumpErrorPath, {});
    const dumpError = new DumpError(logger) as Perform.DumpErrorFunction;

    /* start intercepting stdout and stderr */
    let capturedConsoleLog = '';
    let capturedConsoleError = '';
    let unhookIntercept = intercept(
      (txt: string) => {
        capturedConsoleLog += txt;
      },
      (txt: string) => {
        capturedConsoleError += txt;
      },
    );

    /* dump an error */
    const err: Perform.IErr = new Error('Test error');
    err['statusCode'] = 100;
    err['dumped'] = false;
    dumpError(err);

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that error message logged to console.log */
    expect(capturedConsoleLog.includes(err.message), 'error message logged').to
      .be.true;

    /* test that error name logged to console.log */
    expect(capturedConsoleLog.includes(err.name), 'error name logged').to.be
      .true;

    /* test that error stack logged to console.log */
    expect(capturedConsoleLog.includes('at'), 'error stack logged').to.be.true;

    /* test that stderr is empty - logger sends to stdout */
    expect(capturedConsoleError).to.eql('', 'stderr will be empty');

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
    expect(capturedConsoleLog.includes(err.message), 'error not redumped').to.be
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

    /* test a null error */

    /* clear and start intercepting console.log again */
    capturedConsoleLog = '';
    unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });

    /* dump null as error */
    dumpError(null);

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that info is not dumped */
    expect(capturedConsoleLog.includes('err is null'), 'null warning').to.be
      .true;
  });

  it('should log to console.error and console.log', async function runTest() {
    debug(
      `Running ${modulename}: it - should log to console.error and console.log`,
    );

    /* a logger is not passed so dumpError sends to console.error (stderr). Note that there will be no formatting provided by a logger */

    /* use proxyquire to reload DumpError */
    const { DumpError } = proxyquire(dumpErrorPath, {});
    /* don't pass logger to dumpError */
    const dumpError = new DumpError() as Perform.DumpErrorFunction;

    /* start intercepting stdout and stderr */
    let capturedConsoleLog = '';
    let capturedConsoleError = '';
    const unhookIntercept = intercept(
      (txt: string) => {
        capturedConsoleLog += txt;
      },
      (txt: string) => {
        capturedConsoleError += txt;
      },
    );
    /* dump an error */
    const err: Perform.IErr = new Error('Test error');
    err['statusCode'] = 100;
    err['dumped'] = false;
    dumpError(err);

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that error message logged to console.error */
    expect(capturedConsoleError.includes(err.message), 'error message logged')
      .to.be.true;

    /* test that stderr is empty - logger sends to stdout */
    expect(capturedConsoleLog).to.eql('', 'stdlog will be empty');
  });
});
