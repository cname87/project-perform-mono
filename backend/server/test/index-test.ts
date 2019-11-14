/* import configuration parameters into process.env first */
import '../../utils/src/loadEnvFile';

import { join, sep } from 'path';
const modulename = __filename.slice(__filename.lastIndexOf(sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('Application tests', () => {
  const appRoot = require('app-root-path').toString();
  const indexPath = '../src/index';
  const { config } = require(join(
    appRoot,
    'backend',
    'dist',
    'server',
    'src',
    'configServer',
  ));

  const logger = new config.Logger();
  const DumpError = config.DumpError;
  const dumpError = new DumpError(logger);

  /* require a database as default */
  config.IS_NO_DB_OK = false;

  const proxyquire = require('proxyquire');
  const util = require('util');
  const sleep = util.promisify(setTimeout);
  const httpRequest = require('request-promise-native');
  const fs = require('fs');

  const chai = require('chai');
  const sinon = require('sinon');
  const sinonChai = require('sinon-chai');
  chai.use(sinonChai);
  const expect = chai.expect;
  sinon.assert.expose(chai.assert, {
    prefix: '',
  });

  let index: any = {};
  let runIndex = () => {};
  let spyDebug: any;
  let spyLoggerError: any;
  let spyLoggerInfo: any;
  let spyConsoleError: any;
  let spyDumpError: any;

  const options = {
    url: process.env.HOST,
    key: fs.readFileSync(config.HTTPS_KEY),
    cert: fs.readFileSync(config.HTTPS_CERT),
    ca: fs.readFileSync(config.ROOT_CA),
  };

  const serverIsUp = () => {
    let response;
    return new Promise(async (resolve) => {
      for (let tryConnectCount = 1; tryConnectCount <= 10; tryConnectCount++) {
        try {
          debug(
            modulename +
              ': connect to local host' +
              ` - attempt ${tryConnectCount}`,
          );
          response = await httpRequest(options);
          resolve(response);
          break; // loop will continue even though promise resolved
        } catch (err) {
          debug(
            modulename +
              ': failed to connect to local host' +
              ` - attempt ${tryConnectCount}`,
          );
          await sleep(500);
          continue;
        }
      }

      /* if loop ends without earlier resolve() */
      resolve(new Error('Connection failed'));
    });
  };

  const indexIsExited = (spy: any, spyString: any) => {
    return new Promise(async (resolve) => {
      for (let checkDebugCount = 1; checkDebugCount <= 10; checkDebugCount++) {
        debug(
          modulename +
            ': index still running' +
            ` - attempt ${checkDebugCount}`,
        );
        if (spy.calledWith(spyString) === true) {
          debug(
            modulename + ': Index exited' + ` - attempt ${checkDebugCount}`,
          );
          resolve('Index has exited');
          break;
        }
        await sleep(500);
      }

      /* if loop ends without an earlier resolve() */
      resolve(new Error('Connection failed'));
    });
  };

  before('Set up runIndex and spies', async () => {
    spyDebug = sinon.spy();
    spyLoggerInfo = sinon.spy();
    spyLoggerError = sinon.spy();
    spyDumpError = sinon.spy();

    /* spy on console.error (as node may send warnings there) */
    spyConsoleError = sinon.spy(console, 'error');

    /* stub Logger */
    config.Logger = class Logger {
      constructor() {
        return {
          info: (message: any) => {
            logger.info(message);
            spyLoggerInfo(message);
          },
          error: (message: any) => {
            logger.error(message);
            spyLoggerError(message);
          },
        };
      }
    };

    /* stub DumpError */
    config.DumpError = class DumpErrorStub {
      constructor() {
        return (err: any) => {
          dumpError(err);
          spyDumpError(err);
        };
      }
    };

    runIndex = () => {
      /**
       * Use proxyquire to stub a module require() in a module
       * under test.
       * Note that index.js is loaded & run here i.e. no
       * other require('/index') allowed.
       * The debug module is stubbed out.
       * The property 'debug is replacing require('debug') and
       * therefore is a function that is called with a 'prefix'
       * and returns a function that acts like debug('TextToOutput)
       * i.e. it prints the textToOutput with the prefix.
       * The stubbed debug is also spied via an anonymous
       * sinon spy - spyDebug.
       */
      const { index: indexLocal } = proxyquire(indexPath, {
        debug: (prefix: any) => {
          return (message: any) => {
            require('debug')(prefix)(message);
            spyDebug(message);
          };
        },
        './configServer': config,
      });
      /* assign destructured index to module variable */
      index = indexLocal;
    };

    debug(modulename + ':\n\n *** Tests start here ***\n\n');
  });

  beforeEach('Reset spies', () => {
    sinon.resetHistory();
  });

  afterEach('Reset spies', () => {
    sinon.resetHistory();
  });

  after('Reset stubs and spies', () => {
    sinon.resetHistory();
    sinon.restore();
  });

  it('Tests a running server', async () => {
    /* require index.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    expect(
      spyDebug
        .getCall(spyDebug.callCount - 1)
        .calledWith('\\index.js: server up and running'),
    ).to.be.true;

    /* shut her down */
    await index.sigint();
    response = await indexIsExited(
      spyDebug,
      '\\index.js: SIGINT - ' + 'will exit normally with code 0',
    );
    expect(response).not.to.be.instanceof(Error);

    expect(spyConsoleError.notCalled).to.be.true;

    expect(spyLoggerError.notCalled).to.be.true;

    expect(spyDumpError.notCalled).to.be.true;

    expect(
      spyLoggerInfo
        .getCall(spyLoggerInfo.callCount - 1)
        .calledWith(sinon.match('SIGINT REQUEST')),
    ).to.be.true;
  });

  it('Tests a running server error', async () => {
    /* require index.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    expect(
      spyDebug
        .getCall(spyDebug.callCount - 1)
        .calledWith('\\index.js: server up and running'),
    ).to.be.true;

    /* trigger the server error event
     * handler will cause the overall programme to exit
     * don't use await and can't exit with process.exit()
     * or else follow-on async statements not reached */
    index.appLocals.servers[0].expressServer.emit(
      'error',
      new Error('Test Error'),
    );

    response = await indexIsExited(
      spyDebug,
      '\\index.js: ' + 'will exit with code -3',
    );
    expect(response).not.to.be.instanceof(Error);

    expect(spyConsoleError.notCalled).to.be.true;

    expect(
      spyLoggerError.lastCall.calledWith(
        '\\index.js: ' + 'Unexpected server error - exiting',
      ),
    ).to.be.true;

    expect(spyDumpError.called).to.be.true;
  });

  it('Tests a closeAll error', async () => {
    /* require index.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    expect(
      spyDebug
        .getCall(spyDebug.callCount - 1)
        .calledWith('\\index.js: server up and running'),
    ).to.be.true;

    /* stub process to create an error during closeAll */
    const processStub = sinon.stub(process, 'removeListener');
    processStub.throws(new Error('Test error'));

    /* trigger the server error event
     * handler will cause the overall programme to exit
     * don't use await and can't exit with process.exit()
     * or else follow-on async statements not reached */
    index.appLocals.servers[0].expressServer.emit(
      'error',
      new Error('Test Error'),
    );

    response = await indexIsExited(
      spyDebug,
      '\\index.js: ' + 'will exit with code -4',
    );
    expect(response).not.to.be.instanceof(Error);

    processStub.restore();

    expect(spyConsoleError.notCalled).to.be.true;

    expect(
      spyLoggerError.lastCall.calledWith(
        '\\index.js: ' + 'closeAll error - exiting',
      ),
    ).to.be.true;

    expect(spyDumpError.called).to.be.true;
  });

  it('Tests a server start with database fail, and database is required', async () => {
    /* stub so connectDB throws an error */
    const runRestore = config.runDatabaseApp;
    config.runDatabaseApp = () => {
      throw new Error('Test error');
    };

    /* require index.js */
    runIndex();

    const response = await indexIsExited(
      spyDebug,
      '\\index.js: ' + 'will exit with code -1',
    );
    expect(response).not.to.be.instanceof(Error);

    await sleep(3000);

    /* restore database */
    config.runDatabaseApp = runRestore;

    expect(spyConsoleError.notCalled).to.be.true;

    expect(spyDumpError.called).to.be.true;

    expect(
      spyLoggerError
        .getCall(spyLoggerError.callCount - 1)
        .calledWith('\\index.js: ' + 'no database connection - exiting'),
    ).to.be.true;
  });

  it('Tests a server start with database fail, and database not required', async () => {
    /* allow server start with no database */
    config.IS_NO_DB_OK = true;

    /* stub so connectDB returns (not throws) an error
     * this means the dbConnection object will equal an error */
    const runRestore = config.runDatabaseApp;
    config.runDatabaseApp = () => {
      throw new Error('Test error');
    };

    /* require index.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    /* restore database */
    config.runDatabaseApp = runRestore;

    /* restore */
    config.IS_NO_DB_OK = false;

    expect(
      spyDebug
        .getCall(spyDebug.callCount - 1)
        .calledWith('\\index.js: server up and running'),
    ).to.be.true;

    /* shut her down */
    index.sigint();
    response = await indexIsExited(
      spyDebug,
      '\\index.js: SIGINT - ' + 'will exit normally with code 0',
    );
    expect(response).not.to.be.instanceof(Error);

    expect(
      spyLoggerError.calledWith(
        '\\index.js: database start up error - continuing',
      ),
    ).to.be.true;

    expect(spyConsoleError.notCalled).to.be.true;

    expect(spyDumpError.called).to.be.true;
  });

  it('Tests a server start up fail', async () => {
    /* set up so startServer throws an error */
    const startServerRestore = config.startServer;
    config.startServer = () => {
      throw new Error('Test error');
    };

    /* require index.js */
    runIndex();
    const response = await indexIsExited(
      spyDebug,
      '\\index.js: ' + 'will exit with code -2',
    );
    expect(response).not.to.be.instanceof(Error);

    config.startServer = startServerRestore;

    expect(spyConsoleError.notCalled).to.be.true;

    expect(spyDumpError.called).to.be.true;

    expect(
      spyLoggerError
        .getCall(spyLoggerError.callCount - 1)
        .calledWith('\\index.js: ' + 'server start up error - exiting'),
    ).to.be.true;
  });

  it('Tests uncaught exception', async () => {
    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* require index.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    await index.uncaughtException(new Error('Test Error'));

    response = await indexIsExited(
      spyDebug,
      '\\index.js: ' + 'all connections & listeners closed',
    );
    expect(response).not.to.be.instanceof(Error);

    expect(stubProcess.calledWith(-11), 'process.exit(-11) called').to.be.true;
    stubProcess.restore();

    expect(
      spyLoggerError.lastCall.calledWith(sinon.match('uncaught exception')),
    ).to.be.true;

    expect(spyConsoleError.notCalled).to.be.true;

    expect(spyDumpError.called).to.be.true;
  });

  it('Tests uncaught rejection', async () => {
    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* require index.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    await index.unhandledRejection('Test Rejection', 'promise rejected');

    response = await indexIsExited(
      spyDebug,
      '\\index.js: ' + 'all connections & listeners closed',
    );
    expect(response).not.to.be.instanceof(Error);

    expect(stubProcess.calledWith(-12), 'process.exit(-12) called').to.be.true;
    stubProcess.restore();

    expect(
      spyLoggerError.lastCall.calledWith(
        sinon.match('unhandled promise rejection'),
      ),
    ).to.be.true;

    expect(spyConsoleError.notCalled).to.be.true;

    expect(spyDumpError.called).to.be.true;
  });
});
