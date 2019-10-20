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
 * The database used up by the server is checked below to ensure it is database named 'test'  If it isn't the test run will abort.
 *
 */

/* import configuration parameters into process.env first */
import '../../utils/src/loadEnvFile';

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

/* use proxyquire for index.js module loading */
import proxyquire from 'proxyquire';
import { EventEmitter } from 'events';
import puppeteer from 'puppeteer-core';
import winston from 'winston';
import { Request } from 'express';

/* internal dependencies */
import { configServer } from '../../configServer';

/* variables */
const indexPath = '../../index';
const dbTestName = 'test';
/* path to chrome executable */
const chromeExec =
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
/* url that initiates the client-fired tests */
const fireTestUrl = `${configServer.HOST}testServer/api-loadMocha.html`;
/* hold browser open for this time (ms) */
const browserDelay = 5000;
/* event names */
const indexRunApp = 'indexRunApp';
const indexSigint = 'indexSigint';
const handlersRaiseEvent = 'handlersRaiseEvent';

describe('server API', () => {
  debug(`Running ${modulename} describe - server API`);

  /* shared variables */
  let index: Perform.IServerIndex;
  let eventEmitter: EventEmitter;
  let spyConsoleError: sinon.SinonSpy<[any?, ...any[]], void>;
  let spyLoggerError: sinon.SinonSpy<[object], winston.Logger>;
  let spyDumpError: sinon.SinonSpy<any>;

  /* awaits that server index.ts has run and fired the completion event */
  const serverIndexStart = (): Promise<Perform.IServerIndex> => {
    debug(modulename + ': awaiting server up');
    return new Promise(async (resolve, reject) => {
      /* use proxyquire in case index.js already required */
      const { index: serverIndex } = proxyquire(indexPath, {});
      /* Note: You need index.ts to define 'event' before the db setup call as the async db set up (which cannot easily be awaited) means the next line is executed before the db is up and 'index.event' needs to be defined by then */
      serverIndex.appLocals.event.once(
        indexRunApp,
        (arg: { message: string }) => {
          if (arg.message === 'Server running 0') {
            debug(
              modulename + ': server running message caught: ' + arg.message,
            );
            resolve(serverIndex);
          } else {
            debug(modulename + ': server running error caught: ' + arg.message);
            reject(
              new Error('Server running rejected message: ' + arg.message),
            );
          }
        },
      );
    });
  };

  /* run index.js and set up all spies */
  const runServerAndSetupSpies = async () => {
    /* spy on console.error */
    spyConsoleError = sinon.spy(console, 'error');
    /* run server index.js */
    index = await serverIndexStart();
    /* test that the database is the test database */
    if (index.appLocals.database.dbConnection.db.databaseName !== dbTestName) {
      throw new Error('Test database not loaded + aborting tests');
    }
    /* Now define all objects that are dependent on index being started */
    spyLoggerError = sinon.spy(index.appLocals.logger, 'error');
    spyDumpError = sinon.spy(index.appLocals, 'dumpError');
    eventEmitter = index.appLocals.event;
    /* stub the authenticate handler and set req.auth,sub to the name of the test database collection */
    sinon
      .stub(index.appLocals.handlers, 'authenticateHandler')
      .callsFake((_req, _res, next) => {
        const req = _req as Request;
        req.auth = {
          sub: process.env.userTestId as string,
          permissions: ['all:testDB'],
        };
        next();
      });
  };

  /* awaits that index.ts has shut and fired the completion event */
  const serverIndexShutdown = (serverIndex: Perform.IServerIndex) => {
    debug(modulename + ': awaiting server shutdown');
    return new Promise((resolve, reject) => {
      serverIndex.appLocals.event.once(indexSigint, (arg) => {
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

  afterEach('Reset spies', () => {
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
      let browserInstance: puppeteer.Browser;

      const browserEventsCallback = (arg: { message: string }) => {
        /* try needed as errors thrown within this function
         will be seen as a server error and not fail the
         mocha test - a reject causes a test case fail */
        try {
          switch (arg.message) {
            case 'API tests start':
            case 'Failed API tests start':
            case 'Invalid API requests tests start':
            case 'Angular fall back test start':
            case 'File retrieval test start':
              break;
            case 'Bad database tests start':
              /* this mocks membersHandlers mongoose queries */
              /* only way to stub mongoose queries is to mock entire chain */
              //
              /* mock addMember */
              function FakeMembers(this: any) {
                this.save = () => {
                  return {
                    then: () => {
                      return {
                        catch: (cb: any) =>
                          cb(new Error('Test database fail error')),
                      };
                    },
                  };
                };
              }
              sinon
                .stub(index.appLocals.models, 'members')
                .callsFake(FakeMembers);
              /* mock getMember */
              const fakeFindOne: any = () => {
                return {
                  exec: () => {
                    return {
                      then: () => {
                        return {
                          catch: (cb: any) =>
                            cb(new Error('Test database fail error')),
                        };
                      },
                    };
                  },
                };
              };
              sinon
                .stub(index.appLocals.models.members, 'findOne')
                .callsFake(fakeFindOne);
              /* mock getMembers */
              const fakeFind: any = () => {
                return {
                  where: () => {
                    return {
                      regex: () => {
                        return {
                          lean: () => {
                            return {
                              select: () => {
                                return {
                                  exec: () => {
                                    return {
                                      then: () => {
                                        return {
                                          catch: (cb: any) =>
                                            cb(
                                              new Error(
                                                'Test database fail error',
                                              ),
                                            ),
                                        };
                                      },
                                    };
                                  },
                                };
                              },
                            };
                          },
                        };
                      },
                    };
                  },
                };
              };
              sinon
                .stub(index.appLocals.models.members, 'find')
                .callsFake(fakeFind);
              /* mock updateMember */
              const fakeFindOneAndUpdate: any = () => {
                return {
                  exec: () => {
                    return {
                      then: () => {
                        return {
                          catch: (cb: any) =>
                            cb(new Error('Test database fail error')),
                        };
                      },
                    };
                  },
                };
              };
              sinon
                .stub(index.appLocals.models.members, 'findOneAndUpdate')
                .callsFake(fakeFindOneAndUpdate);
              /* mock deleteMember */
              const fakeDeleteOne: any = () => {
                return {
                  exec: () => {
                    return {
                      then: () => {
                        return {
                          catch: (cb: any) =>
                            cb(new Error('Test database fail error')),
                        };
                      },
                    };
                  },
                };
              };
              sinon
                .stub(index.appLocals.models.members, 'deleteOne')
                .callsFake(fakeDeleteOne);
              /* mock deleteMembers */
              const fakeDeleteMany: any = () => {
                return {
                  exec: () => {
                    return {
                      then: () => {
                        return {
                          catch: (cb: any) =>
                            cb(new Error('Test database fail error')),
                        };
                      },
                    };
                  },
                };
              };
              sinon
                .stub(index.appLocals.models.members, 'deleteMany')
                .callsFake(fakeDeleteMany);
              break;
            case 'API tests end':
            case 'Angular fall back test end':
            case 'File retrieval test end':
              expect(spyConsoleError.notCalled).to.be.true;
              expect(spyLoggerError.notCalled).to.be.true;
              expect(spyDumpError.notCalled).to.be.true;
              sinon.resetHistory();
              break;
            case 'Failed API tests end':
            case 'Invalid API requests tests end':
              expect(spyConsoleError.called).to.be.false;
              expect(spyLoggerError.called).to.be.true;
              expect(spyDumpError.called).to.be.true;
              sinon.resetHistory();
              break;
            case 'Bad database tests end':
              expect(spyConsoleError.called).to.be.false;
              expect(spyLoggerError.called).to.be.true;
              expect(spyDumpError.called).to.be.true;
              sinon.resetHistory();
              // restore
              break;
            case 'End tests':
              expect(spyConsoleError.notCalled).to.be.true;
              expect(spyLoggerError.notCalled).to.be.true;
              expect(spyDumpError.notCalled).to.be.true;
              sinon.resetHistory();
              endTestCalled = true;
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
          /* close down chrome if configured to start automatically, i.e. not disabled */
          if (process.env.DISABLE_CHROME !== 'true') {
            setTimeout(() => {
              browserInstance.close();
              /* only resolve when chrome closed */
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
      if (process.env.DISABLE_CHROME !== 'true') {
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
