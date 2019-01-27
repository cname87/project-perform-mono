'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('monitor', function() {

    debug(modulename + ':\n\n *** describe server monitor starts here ***\n\n');

    const monitorPath = '../dist/monitor/monitor';
    const { config } = require('../dist/.config');

    const util = require('util');
    const setImmediatePromise = util.promisify(setImmediate);

    const chai = require('chai');
    const sinon = require('sinon');
    const sinonChai = require('sinon-chai');

    chai.use(sinonChai);
    const expect = chai.expect;
    sinon.assert.expose(chai.assert, {
        prefix: '',
    });

    /* variables used throughout */
    let monitor;
    let monitorConfig;
    let start;
    let exit;
    let uncaughtException;
    let unhandledRejection;
    let spyDebug;
    let spyLoggerError;
    let spyDumpError;
    let spyConsoleError;

    /* checks monitor debug function once after a wait */
    const checkMonitorDebugOnce = (spyDebug, spyDebugString, checkDebugCount) => {

        return new Promise(function(resolve) {

            debug(modulename + ': Checking for: \n' +
                ` - ${spyDebugString} ` + '\n' +
                ` - attempt ${checkDebugCount}`);

            setTimeout(() => {
                if (spyDebug.lastCall && spyDebug.lastCall.lastArg === spyDebugString) {

                    debug(modulename + ': Confirmed last debug string was: \n' +
                        ` - ${spyDebugString}` + '\n' +
                        ` - on attempt ${checkDebugCount}`);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 500);

        });

    };

    /* loop check monitor debug function and returns true or false */
    const checkMonitorDebug = async (spyDebug, spyDebugString) => {

        for (let checkDebugCount = 1; checkDebugCount <= 20;
            checkDebugCount++) {

            const response = await checkMonitorDebugOnce(spyDebug, spyDebugString, checkDebugCount);
            /* true if spyDebugString was last seen by spyDebug */
            if (response === true) {
              /* allow an event cycle */
              await setImmediatePromise();
              return true;
            }

        }

        /* throw error if all loops fail */
        throw new Error('Monitor debug check failed');
    }

    before('Set up spies', async function() {

        debug(modulename + ':\n\n *** before starts here ***\n\n');

        /* you can't start in watch mode as once started in watch mode
         * the only way to exit is via a process.exit which closes mocha */
        config.WATCH_FILES = false;
        /* set maximum number of tries = 2 */
        config.MAX_STARTS = 2;

        /* start up via rewire and stop, so have access to monitor properties */
        monitor = require(monitorPath);

        /* capture monitor exports for all tests */
        start = monitor.testStart;
        exit = monitor.testExit;
        uncaughtException = monitor.testUncaughtException;
        unhandledRejection = monitor.testUnhandledRejection;
        /* create a copy of config that you can edit */
        monitorConfig = {};
        for (let key in monitor.config) {
          if (monitor.config.hasOwnProperty(key)) {
            monitorConfig[key] = monitor.config[key];
          }
        };

        /* spy on monitor functions */
        spyDebug = sinon.spy(monitor, 'debug');
        spyLoggerError = sinon.spy(monitor.logger, 'error');
        spyDumpError = sinon.spy(monitor, 'dumpError');

        /* spy on console.error (as node may send warnings there) */
        spyConsoleError = sinon.spy(console, 'error');

        /* confirm monitor is up */
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* close all */
        exit('close');
        spyDebugString = "\\monitor.js: child exited with code '31017'";
        await checkMonitorDebug(spyDebug, spyDebugString);

    });

    beforeEach('Reset spies', function() {

        debug(modulename + ':\n\n *** beforeEach starts here ***\n\n');

        spyDebug.resetHistory();
        spyLoggerError.resetHistory();
        spyDumpError.resetHistory();
        spyConsoleError.resetHistory();

    });

    afterEach('Reset spies', async function() {

        debug(modulename + ':\n\n *** afterEach starts here ***\n\n');

        spyDebug.resetHistory();
        spyLoggerError.resetHistory();
        spyDumpError.resetHistory();
        spyConsoleError.resetHistory();


    });

    after('Reset stubs and spies', function() {

        debug(modulename + ':\n\n *** after starts here ***\n\n');

        spyDebug.resetHistory();
        spyLoggerError.resetHistory();
        spyDumpError.resetHistory();
        spyConsoleError.resetHistory();
        spyConsoleError.restore();

    });

    it('Tests watch:restart', async function() {

        debug(modulename + ':\n\n *** watch:restart starts here ***\n\n');

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);
        const child = monitor.child;

        /* emit the test event */
        child.emit('watch:restart', {
            stat: 'test',
        });

        /* close all */
        exit('SIGINT');
        spyDebugString = "\\monitor.js: child exited with code '31017'";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* test that the event function was called */
        expect(spyDebug
            .calledWith('\\monitor.js: ' +
            'forever restarting script because test changed'))
            .to.be.true;

        /* check no errors */
        expect(spyConsoleError.notCalled).to.be.true;
        expect(spyLoggerError.notCalled).to.be.true;
        expect(spyDumpError.notCalled).to.be.true;

    });

    it('Tests child restart, and not restart', async function() {

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);
        let child = monitor.child;

        /* sending other than 'close' will cause index.js to throw an error */
        child.send({
            action: 'crash',
        });

        /* allow close and restart */
        const maxRetries = monitorConfig.MAX_STARTS - 1;
        /* NOTE: Check for restart script not server up script to avoid timing errors */
        spyDebugString = `\\monitor.js: forever restarting script - restart number: 1 of ${maxRetries}`;
        await checkMonitorDebug(spyDebug, spyDebugString);
        child = monitor.child;

        /* check no errors */
        expect(spyConsoleError.notCalled).to.be.true;
        /* logger.error will have been called */
        expect(spyLoggerError.called).to.be.true;
        expect(spyDumpError.notCalled).to.be.true;

        expect(spyDebug.calledWith(`\\monitor.js: forever restarting script - restart number: 1 of ${maxRetries}`)).to.be.true;

        /* send a second crash */
        child.send({
            action: 'crash',
        });

        /* monitor will not restart server and will close */
        spyDebugString = "\\monitor.js: child exited with code '4294967284'";
        await checkMonitorDebug(spyDebug, spyDebugString);

//         await sleep(500);

        /* check no errors */
        expect(spyConsoleError.notCalled).to.be.true;
        /* logger.error will have been called */
        expect(spyLoggerError.called).to.be.true;
        expect(spyDumpError.notCalled).to.be.true;

    });

    it('Tests uncaught exception', async function() {

        /* set up so process.exit stubbed */
        const stubProcess = sinon.stub(process, 'exit');

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* test uncaughtException function */
        const testError = new Error('Test Error');
        await uncaughtException(testError);

        expect(stubProcess.calledWith(1),
            'process.exit(1) called').to.be.true;
        stubProcess.restore();

        expect(spyDumpError
            .calledWith(testError))
            .to.be.true;

        expect(spyConsoleError.notCalled).to.be.true;

        /* test and ensure monitor has exited */
        spyDebugString = "\\monitor.js: child exited with code '31017'";
        await checkMonitorDebug(spyDebug, spyDebugString);

    });

    it('Tests uncaught rejection', async function() {

        /* set up so process.exit stubbed */
        const stubProcess = sinon.stub(process, 'exit');

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* test unhandledRejection function */
        await unhandledRejection('Test Rejection', 'promise rejected');

        expect(stubProcess.calledWith(1),
            'process.exit(1) called').to.be.true;
        stubProcess.restore();

        expect(spyLoggerError
            .calledWith(sinon.match('unhandled promise rejection')))
            .to.be.true;

        expect(spyConsoleError.notCalled).to.be.true;

        /* test and ensure monitor has exited */
        spyDebugString = "\\monitor.js: child exited with code '31017'";
        await checkMonitorDebug(spyDebug, spyDebugString);

    });

    it('Tests unexpected exit with no child', async function() {

        /* set up so process.exit stubbed */
        const stubProcess = sinon.stub(process, 'exit');

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* test exit path where child does not exist */
        const childBak = monitor.child;
        monitor.child = null;
        exit('Test');
        /* note that monitor/server does not exit */

        /* test process.exit called */
        expect(stubProcess.calledWith(1),
            'process.exit(1) called').to.be.true;
        stubProcess.restore();

        expect(spyLoggerError
            .calledWith('\\monitor.js: exiting due to: ' +
            'Test - child not running'))
            .to.be.true;

        /* close monitor */
        monitor.child = childBak;
        exit('SIGINT');
        spyDebugString = "\\monitor.js: child exited with code '31017'";
        await checkMonitorDebug(spyDebug, spyDebugString);

        expect(spyConsoleError.notCalled).to.be.true;

    });

    it('Tests starting with inspector', async function() {

        /* set up so process.exit stubbed */
        const stubProcess = sinon.stub(process, 'exit');

        /* test running child with debug */
        monitorConfig.IS_MONITOR_DEBUG = true;

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* close monitor */
        exit('SIGINT');
        spyDebugString = "\\monitor.js: child exited with code '31017'";
        await checkMonitorDebug(spyDebug, spyDebugString)

        /* test process.exit not called */
        expect(stubProcess.called,
            'process.exit not called').to.be.false;
        stubProcess.restore();

        expect(spyConsoleError.notCalled).to.be.true;

    });

    it('Tests starting without inspector', async function() {

        /* set up so process.exit stubbed */
        const stubProcess = sinon.stub(process, 'exit');

        /* test running child with debug */
        monitorConfig.IS_MONITOR_DEBUG = false;

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* close monitor */
        exit('SIGINT');
        spyDebugString = "\\monitor.js: child exited with code '31017'";
        await checkMonitorDebug(spyDebug, spyDebugString)

        /* test process.exit not called */
        expect(stubProcess.called,
            'process.exit not called').to.be.false;
        stubProcess.restore();

        expect(spyConsoleError.notCalled).to.be.true;

    });

    it('Tests watch exit function path', async function() {

        /* set up so process.exit stubbed */
        const stubProcess = sinon.stub(process, 'exit');;

        /* allow monitor.js to load */
        await start();
        let spyDebugString = "\\monitor.js: Monitor received confirmation: Server is running";
        await checkMonitorDebug(spyDebug, spyDebugString);

        /* set to true so watch mode exit path executed */
        /* not set before monitor first runs as it causes Mocha exit issues */
        config.WATCH_FILES = true

        /* close monitor through watch path */
        exit('SIGINT');
        spyDebugString = "\\monitor.js: calling process.exit as watch enabled";
        await checkMonitorDebug(spyDebug, spyDebugString)

        /* test process.exit called */
        expect(stubProcess.calledWith(0),
            'process.exit(0) called').to.be.true;
        stubProcess.restore();

        expect(spyConsoleError.notCalled).to.be.true;

    });

});
