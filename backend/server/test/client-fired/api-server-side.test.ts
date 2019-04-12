/**
 * Runs a set of tests fired by a client-side browser script.
 *
 * The tests test all api paths including validation fails.
 *
 * To run:
 *
 * Run the server, run this and then run the client-side scripts via the browser (which trigger events that cause the tests below to be run).
 *
 * Note that the client-side scripts are called automatically via a chrome call below if an environment variable is so configured.  Disable this if you want to run the browser via a VSCode launch configuration (e.g. if you want debug breakpoints to be set).
 *
 * The following parameters should be set in config.ts:
 * config.IS_NO_DB_OK = false; i.e. a database is required.
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
import * as chromeLauncher from 'chrome-launcher';
import { EventEmitter } from 'events';
import winston = require('winston');

/* internal dependencies */
import { IServerIndex } from '../../src/configServer';
const indexPath = '../../src/index';

/* url that initiates the client-fired tests */
const fireTestUrl =
  'https://localhost:1337/testServer/api/static/loadMocha.html';
/* hold browser open for this time (ms) */
const browserDelay = 5000;
/* event names */
const indexRunApp = 'indexRunApp';
const indexSigint = 'indexSigint';
const handlersRaiseEvent = 'handlersRaiseEvent';

describe('server API', () => {
  debug(`Running ${modulename} describe - server API`);

  /* shared variables */
  let spyConsoleError: sinon.SinonSpy<[any?, ...any[]], void>;
  let index: IServerIndex;
  let spyLoggerError: sinon.SinonSpy<[object], winston.Logger>;
  let spyDumpError: sinon.SinonSpy<[any], void>;
  let eventEmitter: EventEmitter;

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

  before('set up spies', async () => {
    debug(`Running ${modulename} before - set up spies`);
    await runServerAndSetupSpies();
  });

  beforeEach('Reset spies', () => {
    sinon.resetHistory();
  });

  afterEach('Reset spies', async () => {
    sinon.resetHistory();
  });

  after('close and reset', async () => {
    debug(`Running ${modulename} after - close and reset`);

    debug('Shutting index.js');
    await serverIndexShutdown(index);
    expect(spyConsoleError.notCalled).to.be.true;
    expect(spyLoggerError.notCalled).to.be.true;
    expect(spyDumpError.notCalled).to.be.true;
    sinon.restore();
  });

  it('serves client requests', async () => {
    debug(`Running ${modulename} it - serves client requests`);

    /* set true when browser tests have run */
    let endTestCalled = false;
    await new Promise((resolve, reject) => {
      /* chrome instance that is started */
      let browserInstance: chromeLauncher.LaunchedChrome;

      const browserEventsCallback = (arg: { message: string }) => {
        /* try needed as errors thrown within this function
         * will be seen as a server error and not fail the
         * mocha test - a reject causes a test case fail. */
        try {
          switch (arg.message) {
            case 'API tests start':
              break;
            case 'API tests end':
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

        /* only close when client-fires above end test event */
        if (endTestCalled) {
          eventEmitter.removeListener(
            handlersRaiseEvent,
            browserEventsCallback,
          );
          /* close down chrome if configured to start automatically */
          setTimeout(() => {
            if (process.env.RUN_CHROME === 'true') {
              /* see notes for important detail */
              browserInstance.kill();
            }
          }, browserDelay);
          resolve();
        }
      };

      /* all browser events received here */
      eventEmitter.on('handlersRaiseEvent', browserEventsCallback);

      /* start chrome on mocha test page if so configured */
      if (process.env.RUN_CHROME === 'true') {
        (async () => {
          browserInstance = await chromeLauncher.launch({
            port: 9222,
            startingUrl: fireTestUrl,
            chromeFlags: [
              '--incognito',
              '--start-maximized',
              '--new-window',
              '--disable-popup-blocking',
            ],
          });
        })();
      }
    });
  });
});
