/**
 * Runs a set of tests (under one mocha describe test) fired by client-side
 * scripts.
 *
 * The tests test all error handler functionality.
 *
 * To run:
 *
 * Run the server, run this and then run the client-side scripts via the browser (which trigger events that cause the tests below to be run).
 *
 * Note that the client-side scripts are called automatically via a chrome call below if an environment variable is so configured.  Disable this if you want to run the browser via a VSCode launch configuration (e.g. if you want debug breakpoints to be set).
 *
 * The following parameters should be set in config.ts:
 * config.IS_NO_DB_OK = false; i.e. a database is required.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
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

/* use proxyquire for index.js module loading */
import proxyquireObject = require('proxyquire');
/* ensure fresh load each time */
const proxyquire = proxyquireObject.noPreserveCache();
import puppeteer from 'puppeteer-core';

/* internal dependencies */
import { IServerIndex } from '../../src/configServer';
const indexPath = '../../src/index';
import { EventEmitter } from 'events';
import winston = require('winston');

/* path to chrome executable */
const chromeExec =
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
/* url that initiates the client-fired tests */
const fireTestUrl =
  'https://localhost:1337/testServer/errors/static/loadMocha.html';
/* hold browser open for this time (ms) */
const browserDelay = 5000;
/* event names */
const indexRunApp = 'indexRunApp';
const indexSigint = 'indexSigint';
const handlersRaiseEvent = 'handlersRaiseEvent';

describe('Server', () => {
  debug('Start browser-driven tests');

  /* shared variables */
  let index: IServerIndex;
  let eventEmitter: EventEmitter;
  let spyConsoleError: sinon.SinonSpy<[any?, ...any[]], void>;
  let spyDumpError: sinon.SinonSpy<[any], void>;
  let spyLoggerError: sinon.SinonSpy<[object], winston.Logger>;
  let spyErrorHandlerDebug: sinon.SinonSpy<[any, ...any[]], void>;
  let stubProcessEmit: sinon.SinonStub<
    ['multipleResolves', NodeJS.MultipleResolveListener],
    NodeJS.Process
  >;
  let stubProcessExit: sinon.SinonStub<[number?], never>;

  /* awaits that server index.ts has run and fired the completion event */
  const serverIndexStart = (): Promise<IServerIndex> => {
    debug(modulename + ': awaiting server up');
    return new Promise(async (resolve, reject) => {
      /* use proxyquire in case index.js already required */
      const { index: serverIndex } = proxyquire(indexPath, {});
      /* Note: You need index.ts to define 'event' before the db setup call as the async db set up (which cannot easily be awaited) means the next line is executed before the db is up ND 'index.event' needs to be defined by then */
      serverIndex.event.once(indexRunApp, (arg: { message: string }) => {
        if (arg.message === 'Server running 0') {
          debug(modulename + ': server running message caught: ' + arg.message);
          resolve(serverIndex);
        } else {
          debug(modulename + ': server running error caught: ' + arg.message);
          reject(new Error('Server running rejected message: ' + arg.message));
        }
      });
    });
  };

  /* run index.js and set up all spies */
  const runServerAndSetupSpies = async () => {
    /* spy on console.error */
    spyConsoleError = sinon.spy(console, 'error');
    /* run server index.js */
    index = await serverIndexStart();
    /* Now define all objects that are dependent on index being started */
    spyLoggerError = sinon.spy(index.appLocals.logger, 'error');
    spyDumpError = sinon.spy(index.appLocals, 'dumpError');
    eventEmitter = index.appLocals.event;
    /* stub process.emit - will stub emit uncaught exception handler */
    stubProcessEmit = sinon.stub(process, 'emit');
    /* stub process.exit */
    stubProcessExit = sinon.stub(process, 'exit');
    spyErrorHandlerDebug = sinon.spy(
      index.appLocals.config.ERROR_HANDLERS,
      'debug',
    );
  };

  /* awaits that index.ts has shut and fired the completion event */
  const serverIndexShutdown = (serverIndex: IServerIndex) => {
    debug(modulename + ': awaiting server shutdown');
    return new Promise((resolve, reject) => {
      serverIndex.event.once(indexSigint, (arg) => {
        if (arg.message === 'Server exit 0') {
          debug(modulename + ': server close message caught: ' + arg.message);
          resolve();
        } else {
          debug(modulename + ': server close error caught: ' + arg.message);
          reject(new Error('Server close rejected message: ' + arg.message));
        }
      });
      /* fires sigint which fires the above event */
      serverIndex.sigint();
    });
  };

  before('before', async () => {
    debug(`Running ${modulename} before - set up spies`);
    await runServerAndSetupSpies();
  });

  beforeEach('Reset spies', () => {
    sinon.resetHistory();
  });

  afterEach('Reset spies', async () => {
    sinon.resetHistory();
  });

  after('after', async () => {
    debug(`Running ${modulename} after - close and reset`);

    debug('Shutting index.js');
    await serverIndexShutdown(index);
    expect(spyConsoleError.notCalled).to.be.true;
    expect(spyLoggerError.notCalled).to.be.true;
    expect(spyDumpError.notCalled).to.be.true;
    sinon.restore();
  });

  it('Test browser-fired server functionality', async () => {
    debug(`Running ${modulename} it - serves client requests`);

    /* set true when browser tests have run */
    let endTestCalled = false;
    await new Promise((resolve, reject) => {
      /* chrome instance that is started */
      let browserInstance: puppeteer.Browser;

      const browserEventsCallback = (arg: { message: string }) => {
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
              expect(
                spyErrorHandlerDebug.calledWith(
                  '\\errorHandler.js: not sending a client ' +
                    'response as headers already sent',
                ),
              ).to.be.true;
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
          debug(modulename + ': test fail => exit test');
          reject(err);
        }

        /* only close when browser tests complete */
        if (endTestCalled) {
          eventEmitter.removeListener(
            handlersRaiseEvent,
            browserEventsCallback,
          );
          /* close down chrome if configured to start automatically */
          if (process.env.RUN_CHROME === 'true') {
            setTimeout(() => {
              browserInstance.close();
              /* only resolve when chrome closed a can interfere */
              resolve();
            }, browserDelay);
          } else {
            resolve();
          }
        }
      };

      /* all browser events received here */
      eventEmitter.on(handlersRaiseEvent, browserEventsCallback);

      /* start chrome on mocha test page if so configured */
      if (process.env.RUN_CHROME === 'true') {
        (async () => {
          browserInstance = await puppeteer.launch({
            headless: false,
            executablePath: chromeExec,
            defaultViewport: {
              width: 800,
              height: 800,
            },
            args: [
              '--incognito',
              '--start-maximized',
              '--new-window',
              '--disable-popup-blocking',
            ],
          });
          const page = await browserInstance.newPage();
          await page.goto(fireTestUrl);
        })();
      }
    });
  });
});
