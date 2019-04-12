'use strict';

/**
 * Runs a set of tests (under one mocha describe test) fired by client-side
 * scripts.
 *
 * Run the server, run this and then run the client-side scripts via the browser (which trigger events that cause the tests below to be run).
 *
 * Note that the client-side tests are called automatically via a spawn chrome call below if an environment variable is so configured.  disable this if you want to run the browser via a VSCode launch configuration (e.g. if you want debug breakpoints can be set).
 *
 * The following parameters should be set in config.ts:
 * config.IS_NO_DB_OK = false; i.e. a database is required.
 * config.ENV = 'production'; i.e. test production environment.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debugFunction = require ('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* set up mocha, sinon & chai */
const chai = require ('chai');
const sinon = require ('sinon');
const sinonChai = require ('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* other external dependencies */
/* use proxyquire for index.js module loading */
const proxyquireObject = require('proxyquire');
/* ensure fresh load each time */
const proxyquire = proxyquireObject.noPreserveCache();
const chromeLauncher = proxyquire('chrome-launcher', {});

/* internal dependencies */
const indexPath = '../../dist/server/src/index';

/* browser sub process */
let browserInstance;

/* awaits that index.ts has run and fired the completion event */
function awaitIndex() {
  return new Promise(async (resolve) => {
    /* use proxyquire in case index.js already required */
    const index = proxyquire(indexPath, {});
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
  debug('Start browser-driven tests');

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
    spyLoggerInfo = sinon.spy(index.appLocals.logger, 'info');
    spyLoggerError = sinon.spy(index.appLocals.logger, 'error');
    spyDumpError = sinon.spy(index.appLocals, 'dumpError');
    spyErrorHandlerDebug = sinon.spy(
      index.appLocals.config.ERROR_HANDLERS,
      'debug',
    );
    eventEmitter = index.appLocals.event;
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

  it('Test browser-fired server functionality', async () => {
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
            case 'Coffee test start':
            case 'Sent test start':
            case 'Trap-503 test start':
            case 'Async-handled test start':
            case 'Error test start':
            case 'Async test start':
            case 'Crash test start':
            case 'Return 404 test start':
            case 'Check server up':
              break;
            case '404 test end':
            case 'Coffee test end':
            case 'Return 404 test end':
            case 'Trap-503 test end':
              expect(spyLoggerError.callCount).to.be.greaterThan(1);
              expect(spyDumpError.callCount).to.be.greaterThan(0);
              sinon.resetHistory();
              break;
            case 'Sent test end':
              // second error message informs on header already sent
              expect(spyErrorHandlerDebug.calledWith(
                '\\errorhandler.js: not sending a client ' +
                  'response as headers already sent',
              )).to.be.true;
              // will actually return a not found initially
              expect(spyDumpError.callCount).to.eql(1);
              sinon.resetHistory();
              break;
            case 'Async-handled test end':
              expect(spyLoggerError.callCount).to.eql(4);
              expect(spyDumpError.callCount).to.be.greaterThan(0);
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
          /* close down chrome if configured to start automatically */
          setTimeout( () => {
            if (process.env.RUN_CHROME === 'true') {
              /* appears you must exit chrome in windows 10 to allow node exit */
              /* unref() doesn't work, kill('SIGINT') works and doesn't kill mocha but kills all chrome instances */
              /* only kills chrome in windows 10 */
              browserInstance.kill();
            }
          }, 5000);
          resolve();
        }
      };

      /* all browser events received here */
      eventEmitter.on('handlersRaiseEvent', browserEventsCallback);

      /* start chrome on mocha test page if so configured */
        setTimeout( () => {

          (async () => {
            browserInstance = await chromeLauncher.launch({
              port: 9222,
              startingUrl: 'https://localhost:1337/testServer/browser/run/loadMocha.html',
              chromeFlags: [
                '--incognito',
                '--start-maximized',
                '--new-window',
                '--disable-popup-blocking',
              ],
            });
          })();


        }, 5000);

    });
  });

});
