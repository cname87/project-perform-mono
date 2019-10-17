import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import util = require('util');
const setImmediatePromise = util.promisify(setImmediate);

/* set up mocha, sinon & chai */
import chai = require('chai');
import 'mocha';
import sinon, { SinonSpy } from 'sinon';
import sinonChai = require('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* internal dependencies */
const indexPath = '../src/index';
import { config, IMonitorIndex } from '../src/configMonitor';

describe('server monitor', () => {
  debug(`Running ${modulename} describe - server monitor`);

  /* variables used throughout */
  let monitor: IMonitorIndex;
  const monitorConfig: {
    IS_MONITOR_DEBUG: boolean;
    MAX_STARTS: number;
  } = {} as any;
  let start: IMonitorIndex['runMonitor'];
  let exit: IMonitorIndex['exit'];
  let uncaughtException: IMonitorIndex['uncaughtException'];
  let unhandledRejection: IMonitorIndex['unhandledRejection'];
  let spyDebug: SinonSpy<[string], void>;
  let spyLoggerError: SinonSpy<[any], void>;
  let spyDumpError: SinonSpy<[any], void>;
  let spyConsoleError: SinonSpy<[any?, ...any[]], void>;

  /* checks monitor debug function once after a wait */
  const checkMonitorDebugOnce = (
    spyDebugLog: SinonSpy<[string], void>,
    spyDebugString: string,
    checkDebugCount: number,
  ) => {
    return new Promise((resolve) => {
      debug(
        modulename +
          ': Checking for: \n' +
          ` - ${spyDebugString} ` +
          '\n' +
          ` - attempt ${checkDebugCount}`,
      );

      setTimeout(() => {
        if (
          spyDebugLog.lastCall &&
          spyDebugLog.lastCall.lastArg === spyDebugString
        ) {
          debug(
            modulename +
              ': Confirmed last debug string was: \n' +
              ` - ${spyDebugString}` +
              '\n' +
              ` - on attempt ${checkDebugCount}`,
          );
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  };

  /* loop check monitor debug function and returns true or false */
  const checkMonitorDebug = async (
    spyDebugLog: SinonSpy<[string], void>,
    spyDebugString: string,
  ) => {
    for (let checkDebugCount = 1; checkDebugCount <= 20; checkDebugCount++) {
      const response = await checkMonitorDebugOnce(
        spyDebugLog,
        spyDebugString,
        checkDebugCount,
      );
      /* true if spyDebugString was last seen by spyDebug */
      if (response === true) {
        /* allow an event cycle */
        await setImmediatePromise();
        return true;
      }
    }

    /* throw error if all loops fail */
    throw new Error('Monitor debug check failed');
  };

  before('set up spies', async () => {
    debug(`Running ${modulename} before - set up spies`);

    /* you can't start in watch mode as once started in watch mode the only way to exit is via a process.exit which closes mocha */
    config.WATCH_FILES = false;
    /* set maximum number of tries = 2 */
    config.MAX_STARTS = 2;

    /* start up via rewire and stop, so have access to monitor properties */
    monitor = require(indexPath);

    /* capture monitor exports for all tests */
    start = monitor.runMonitor;
    exit = monitor.exit;
    uncaughtException = monitor.uncaughtException;
    unhandledRejection = monitor.unhandledRejection;
    /* create a copy of config that you can edit */
    monitorConfig.IS_MONITOR_DEBUG = config.IS_MONITOR_DEBUG;
    monitorConfig.MAX_STARTS = config.MAX_STARTS;

    /* spy on monitor functions */
    spyDebug = sinon.spy(monitor, 'debug');
    spyLoggerError = sinon.spy(monitor.logger, 'error');
    spyDumpError = sinon.spy(monitor, 'dumpError');

    /* spy on console.error (as node may send warnings there) */
    spyConsoleError = sinon.spy(console, 'error');

    /* confirm monitor is up */
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* close all */
    exit('close');
    spyDebugString = "\\index.js: child exited with code '31017'";
    await checkMonitorDebug(spyDebug, spyDebugString);
  });

  beforeEach('reset spies', () => {
    debug(`Running ${modulename} beforeEach - reset spies`);

    spyDebug.resetHistory();
    spyLoggerError.resetHistory();
    spyDumpError.resetHistory();
    spyConsoleError.resetHistory();
  });

  afterEach('reset spies', async () => {
    debug(`Running ${modulename} afterEach - reset spies`);

    spyDebug.resetHistory();
    spyLoggerError.resetHistory();
    spyDumpError.resetHistory();
    spyConsoleError.resetHistory();
  });

  after('reset stubs and spies', () => {
    debug(`Running ${modulename} after - reset stubs and spies`);

    spyDebug.resetHistory();
    spyLoggerError.resetHistory();
    spyDumpError.resetHistory();
    spyConsoleError.resetHistory();
    spyConsoleError.restore();
  });

  it('tests watch:restart', async () => {
    debug(`Running ${modulename} it - tests watch:restart`);

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);
    const child = monitor.child;

    /* emit the test event */
    child.emit('watch:restart', {
      stat: 'test',
    });

    /* close all */
    exit('SIGINT');
    spyDebugString = "\\index.js: child exited with code '31017'";
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* test that the event function was called */
    expect(
      spyDebug.calledWith(
        '\\index.js: ' + 'forever restarting script because test changed',
      ),
    ).to.be.true;

    /* check no errors */
    expect(spyConsoleError.notCalled).to.be.true;
    expect(spyLoggerError.notCalled).to.be.true;
    expect(spyDumpError.notCalled).to.be.true;
  });

  it('tests child restart, and not restart', async () => {
    debug(`Running ${modulename} it - tests child restart, and not restart`);

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);
    let child = monitor.child;

    /* sending other than 'close' will cause index.js to throw an error */
    child.send({
      action: 'crash',
    });

    /* allow close and restart */
    const maxRetries = monitorConfig.MAX_STARTS - 1;
    /* NOTE: Check for restart script not server up script to avoid timing errors */
    spyDebugString = `\\index.js: forever restarting script - restart number: 1 of ${maxRetries}`;
    await checkMonitorDebug(spyDebug, spyDebugString);
    child = monitor.child;

    /* check no errors */
    expect(spyConsoleError.notCalled).to.be.true;
    /* logger.error will have been called */
    expect(spyLoggerError.called).to.be.true;
    expect(spyDumpError.notCalled).to.be.true;

    expect(
      spyDebug.calledWith(
        `\\index.js: forever restarting script - restart number: 1 of ${maxRetries}`,
      ),
    ).to.be.true;

    /* send a second crash */
    child.send({
      action: 'crash',
    });

    /* monitor will not restart server and will close */
    spyDebugString = "\\index.js: child exited with code '4294967284'";
    await checkMonitorDebug(spyDebug, spyDebugString);

    //         await sleep(500);

    /* check no errors */
    expect(spyConsoleError.notCalled).to.be.true;
    /* logger.error will have been called */
    expect(spyLoggerError.called).to.be.true;
    expect(spyDumpError.notCalled).to.be.true;
  });

  it('tests uncaught exception', async () => {
    debug(`Running ${modulename} it - tests uncaught exception`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* test uncaughtException function */
    const testError = new Error('Test Error');
    await uncaughtException(testError);

    expect(stubProcess.calledWith(1), 'process.exit(1) called').to.be.true;

    stubProcess.restore();

    expect(spyDumpError.calledWith(testError)).to.be.true;

    expect(spyConsoleError.notCalled).to.be.true;

    /* test and ensure monitor has exited */
    spyDebugString = "\\index.js: child exited with code '31017'";
    await checkMonitorDebug(spyDebug, spyDebugString);
  });

  it('tests uncaught rejection', async () => {
    debug(`Running ${modulename} it - tests uncaught rejection`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* test unhandledRejection function */
    await unhandledRejection('Test Rejection', 'promise rejected');

    expect(stubProcess.calledWith(1), 'process.exit(1) called').to.be.true;
    stubProcess.restore();

    expect(
      spyLoggerError.calledWith(sinon.match('unhandled promise rejection')),
    ).to.be.true;

    expect(spyConsoleError.notCalled).to.be.true;

    /* test and ensure monitor has exited */
    spyDebugString = "\\index.js: child exited with code '31017'";
    await checkMonitorDebug(spyDebug, spyDebugString);
  });

  it('tests unexpected exit with no child', async () => {
    debug(`Running ${modulename} it - tests unexpected exit with no child`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* test exit path where child does not running */
    monitor.child.running = false;
    exit('Test');
    /* note that monitor/server does not exit */

    /* test process.exit called */
    expect(stubProcess.calledWith(1), 'process.exit(1) called').to.be.true;

    stubProcess.restore();

    expect(
      spyLoggerError.calledWith(
        '\\index.js: exiting due to: ' + 'Test - child not running',
      ),
    ).to.be.true;

    /* close monitor */
    monitor.child.running = true;
    exit('SIGINT');
    spyDebugString = "\\index.js: child exited with code '31017'";
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* 27-Apr-19: Possible 'GLOBAL' deprecation warning */
    expect(spyConsoleError.callCount).to.eql(0);
  });

  it('tests starting with inspector', async () => {
    debug(`Running ${modulename} it - tests starting with inspector`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* test running child with debug */
    monitorConfig.IS_MONITOR_DEBUG = true;

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* close monitor */
    exit('SIGINT');
    spyDebugString = "\\index.js: child exited with code '31017'";
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* test process.exit not called */
    expect(stubProcess.called, 'process.exit not called').to.be.false;
    stubProcess.restore();

    expect(spyConsoleError.notCalled).to.be.true;
  });

  it('tests starting without inspector', async () => {
    debug(`Running ${modulename} it - tests starting without inspector`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* test running child with debug */
    monitorConfig.IS_MONITOR_DEBUG = false;

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* close monitor */
    exit('SIGINT');
    spyDebugString = "\\index.js: child exited with code '31017'";
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* test process.exit not called */
    expect(stubProcess.called, 'process.exit not called').to.be.false;
    stubProcess.restore();

    expect(spyConsoleError.notCalled).to.be.true;
  });

  it('tests watch exit function path', async () => {
    debug(`Running ${modulename} it - tests watch exit function path`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* allow monitor.js to load */
    await start();
    let spyDebugString =
      '\\index.js: Monitor received confirmation: Server is running';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* set to true so watch mode exit path executed */
    /* not set before monitor first runs as it causes Mocha exit issues */
    config.WATCH_FILES = true;

    /* close monitor through watch path */
    exit('SIGINT');
    spyDebugString = '\\index.js: calling process.exit as watch enabled';
    await checkMonitorDebug(spyDebug, spyDebugString);

    /* test process.exit called */
    expect(stubProcess.calledWith(0), 'process.exit(0) called').to.be.true;
    stubProcess.restore();

    expect(spyConsoleError.notCalled).to.be.true;
  });
});
