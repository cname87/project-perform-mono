'use strict';

/**
 * Runs a set of tests (under one mocha describe test) fired by client-side
 * scripts.
 * Run this and then run the client-side tests via the browser (which trigger
 * events that cause the tests below to be run).
 * Note that the client-side tests can also be called automatically via a spawn
 * chrome call at the end of the tests below.  Comment out the call below if
 * you want to run the browser externally so breakpoints can be set.
 *
 * The following parameters should be set in config.ts:
 * config.IS_NO_DB_OK = false; i.e. a database is required.
 * config.ENV = 'production'; i.e. test production environment.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debugFunction = require ('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

const chai = require ('chai');
const { spawn } = require ('child_process');
const sinon = require ('sinon');
const sinonChai = require ('sinon-chai');

chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* browser sub process */
let browserInstance;

/* awaits that index.ts has run and fired the completion event */
function awaitIndex() {
  return new Promise(async (resolve) => {
    const index = await require('../dist/index');
    /* Note: You need index.ts to export 'event' before connectToDB as
     * mocha gets control and executes the next line then, and 'index.event'
     * needs to be defined by that line */
    index.event.once('indexRunApp', () => {
      resolve(index);
    });
  });
}

/* awaits that index.ts has shut and fired the completion event */
function awaitIndexShutdown(index) {
  /* shut server down */
  return new Promise((resolve, reject) => {
    index.event.once('indexSigint', (arg) => {
      if (arg.message === 'Server exit 0') {
        console.log('indexSigint caught message: ' + arg.message);
        resolve();
      } else {
        reject(
          new Error('indexSigint rejected message: ' + arg.message),
        );
      }
    });
    /* fires sigint which fires the above event */
    index.sigint();
  });
}

describe('Server', () => {
  debug('Start client tests');

  /* holds index export object */
  let index;
  /* set up various spies */
  let spyIndexDebug;
  let spyLoggerInfo;
  let spyLoggerError;
  let spyDumpError;
  let spyErrorHandlerDebug;
  let stubProcessEmit;
  let stubProcessExit;
  let spyConsoleError;
  // holds index.ts event emitter
  let eventEmitter;

  before('before', async () => {
    debug('Starting index.ts');
      /* stub process.emit - will stub emit uncaught exception handler */
    stubProcessEmit = sinon.stub(process, 'emit');
    /* stub process.exit */
    stubProcessExit = sinon.stub(process, 'exit');
    /* spy on console.error */
    spyConsoleError = sinon.spy(console, 'error');
    index = await awaitIndex();
    /* Now define all objects that are dependent on index being started */
    spyIndexDebug = sinon.spy(index, 'debug');
    spyLoggerInfo = sinon.spy(index.appObjects.logger, 'info');
    spyLoggerError = sinon.spy(index.appObjects.logger, 'error');
    spyDumpError = sinon.spy(index.appObjects, 'dumpError');
    spyErrorHandlerDebug = sinon.spy(
      index.appObjects.config.ERROR_HANDLER,
      'debug',
    );
    eventEmitter = index.appObjects.event;
  });

  beforeEach('Reset spies', () => {
    sinon.resetHistory();
  });

  afterEach('Reset spies', async () => {
    sinon.resetHistory();
  });

  after('after', async () => {
    debug('Shutting index.js');
    await awaitIndexShutdown(index);
    expect(spyIndexDebug.callCount, 'test index debug calls').to.eql(4);
    expect(spyLoggerInfo.callCount, 'test logger info calls').to.eql(1);
    expect(spyLoggerError.callCount, 'test logger error calls').to.eql(0);
    expect(spyDumpError.callCount, 'test dumpError calls').to.eql(0);
    sinon.restore();
  });

  it('Test client-fired server functionality', async () => {
    /* set true when browser tests have run */
    let endTestCalled = false;
    await new Promise((resolve, reject) => {
      const browserEventsCallback = (arg) => {
        /* try needed as errors thrown within this function
         * will be seen as a server error and not fail the
         * mocha test - a reject causes a test case fail. */
        try {
          switch (arg.message) {
            case 'Start tests':
            case '404 test start':
            case '404-prod test start':
            case '404-dev test start':
            case 'Coffee test start':
            case 'Sent test start':
            case 'Trap-503 test start':
            case 'Async-handled test start':
            case 'Error test start':
            case 'Async test start':
            case 'Render error test start':
            case 'Crash test start':
            case 'Return 404 test start':
            case 'Check server up':
              break;
            case '404 test end':
            case '404-prod test end':
            case '404-dev test end':
            case 'Coffee test end':
            case 'Return 404 test end':
            case 'Trap-503 test end':
              expect(spyLoggerError.callCount).to.eql(2);
              expect(spyDumpError.callCount).to.eql(1);
              sinon.resetHistory();
              break;
            case 'Async-handled test end':
              expect(spyLoggerError.callCount).to.eql(2);
              expect(spyDumpError.callCount).to.eql(1);
              sinon.resetHistory();
              break;
            case 'Sent test end':
              // second error message informs on header already sent
              expect(spyErrorHandlerDebug.getCall(1).lastArg).to.eql(
                '\\errorhandler.js: not sending a client ' +
                  'response as headers already sent',
              );
              // will actually return a not found initially
              expect(spyDumpError.callCount).to.eql(1);
              sinon.resetHistory();
              break;
            case 'Error test end':
              expect(stubProcessEmit.called).to.eql(true);
              sinon.resetHistory();
              break;
            case 'Async test end':
              /* unhandled rejection will trigger process to emit an
               * 'unhandled exception' and also 'warning' as the
               * unhandled exception handling is deprecated */
              expect(stubProcessEmit.called).to.eql(true);
              sinon.resetHistory();
              break;
            case 'Render error test end':
              expect(spyLoggerError.getCall(2).lastArg).to.eql(
                '\\errorhandler.js: ' + 'render error - exiting',
              );
              expect(stubProcessEmit.called).to.eql(true);
              sinon.resetHistory();
              break;
            case 'Crash test end':
              expect(stubProcessExit.callCount).to.eql(1);
              sinon.resetHistory();
              break;
            case 'End tests':
              expect(spyConsoleError.notCalled).to.be.true;
              expect(spyLoggerError.notCalled).to.be.true;
              expect(spyDumpError.notCalled).to.be.true;
              endTestCalled = true;
              sinon.resetHistory();
              break;
            default:
              reject(new Error('should not reach this point'));
          }
        } catch (err) {
          /* a test above failed => exit test */
          reject(err);
        }

        /* only close when browser tests complete */
        if (endTestCalled) {
          eventEmitter.removeListener(
            'handlersRaiseEvent',
            browserEventsCallback,
          );
          setTimeout( () => {
          /* appears you must exit chrome in windows 10 to allow node exit */
          /* unref() doesn't work, kill('SIGINT') works and doesn't kill mocha */
          browserInstance.kill('SIGINT');
          }, 5000);
          resolve();
        }
      };

      /* all browser events received here */
      eventEmitter.on('handlersRaiseEvent', browserEventsCallback);

      /* start chrome on mocha test page */
      /* NOTE: Comment out and start via vscode for debug. */
      browserInstance = spawn('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ['https://localhost:1337/testServer/loadMocha.html',
        '--remote-debugging-port=9222',  // Only of use if you attach
        '--incognito',
        '--start-maximized',
        '--new-window',
        '--disable-popup-blocking', // necessary for window.open() to work
        { detached: true, stdio: [ 'ignore', 'ignore', 'ignore' ] }
      ]);
    });
  });

});
