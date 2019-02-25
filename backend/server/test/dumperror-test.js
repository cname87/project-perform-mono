const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('dumpError tests', function() {

    /* logger utility */
    const path = require('path');
    const appRoot = require('app-root-path').toString();
    const loggerPath = '../dist/utils/logger';
    const dumpErrorPath = '../dist/utils/dumpError';
    /* configuration file expected in application root directory */
    const { config: configOriginal } = require(path.join(appRoot, 'dist', '.config'));
    /* create a copy of config that you can edit */
    const config = {};
    let key = '';
    for (key in configOriginal) {

        if (configOriginal.hasOwnProperty(key)) {

            config[key] = configOriginal[key];

        }

    }

    const chai = require('chai');
    const sinon = require('sinon');
    const sinonChai = require('sinon-chai');
    chai.use(sinonChai);
    const expect = chai.expect;
    sinon.assert.expose(chai.assert, {
        prefix: '',
    });

    const proxyquire = require('proxyquire');
    const fs = require('fs');
    const util = require('util');
    const sleep = util.promisify(setTimeout);
    const intercept = require('intercept-stdout');

    before('Set up', function() {

        /* set up test log files */
        // it is assumed process.env.NODE_ENV = 'development'
        config.INFO_LOG = path.join(appRoot, 'logs', 'dumpInfoTest.log');
        config.ERROR_LOG = path.join(appRoot, 'logs', 'dumpErrorTest.log');

        /* files only deleted when all hard links closed,
         * i.e. when programme closes */
        try {

            fs.unlinkSync(config.INFO_LOG);

        } catch (err) {

            /* ok - file didn't exist */

        }

        try {

            fs.unlinkSync(config.ERROR_LOG);

        } catch (err) {

            /* ok - file didn't exist */

        }

        /* create two empty files */
        fs.writeFileSync(config.INFO_LOG, '');
        fs.writeFileSync(config.ERROR_LOG, '');

        debug(modulename + ':\n\n *** Tests start here ***\n\n');

    });

    after('Delete test log files', function() {

        /* files only deleted when all hard links closed,
         * i.e. when programme closes */
        try {

            fs.unlinkSync(config.INFO_LOG);

        } catch (err) {

            /* ok - file didn't exist */

        }

        try {

            fs.unlinkSync(config.ERROR_LOG);

        } catch (err) {

            /* ok - file didn't exist */

        }

    });

    it('should log to files and console.log',
        async function runTest() {

            /* use proxyquire to reload Logger and DumpError */
            const { Logger } = proxyquire(loggerPath, {});
            const logger = await new Logger(config);
            const DumpError = proxyquire(dumpErrorPath, {}).DumpError;
            const dumpError = await new DumpError(logger);

            /* both log files should be empty */
            let infoLog = fs.readFileSync(config.INFO_LOG)
                .toString();
            let errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString();
            expect(infoLog.length === 0, 'info log file to be empty')
                .to.be.true;
            expect(errorLog.length === 0, 'error log file to be empty')
                .to.be.true;

            /* start intercepting console.log */
            let capturedConsoleLog = '';
            let unhookIntercept = intercept(function(txt) {

                capturedConsoleLog += txt;

            });

            /* dump an error */
            const err = new Error('Test error');
            err['status'] = 'Test status';
            err['code'] = 'Test code';
            err['dumped'] = false;
            dumpError(err);

            /* stop intercepting console.log */
            unhookIntercept();

            /* allow logger print to file */
            await sleep(100);

            /* error message */

            /* test that error message logged to console.log */
            expect(capturedConsoleLog.includes('Error Message'),
                'error message logged')
                .to.be.true;

            /* error message dumped to both info and error logs */
            infoLog = fs.readFileSync(config.INFO_LOG)
                .toString();
            errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString();
            expect(infoLog.includes('Error Message'), 'error message printed')
                .to.be.true;
            expect(errorLog.includes('Error Message'), 'error message printed')
                .to.be.true;

            /* error status */

            /* test that error status logged to console.log */
            expect(capturedConsoleLog.includes('Error Status'),
                'error status logged')
                .to.be.true;

            /* error message dumped to both info and error logs */
            infoLog = fs.readFileSync(config.INFO_LOG)
                .toString();
            errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString();
            expect(infoLog.includes('Error Status'), 'error status printed')
                .to.be.true;
            expect(errorLog.includes('Error Status'), 'error status printed')
                .to.be.true;

            /* error code */

            /* test that error status logged to console.log */
            expect(capturedConsoleLog.includes('Error Code'),
                'error code logged')
                .to.be.true;

            /* error message dumped to both info and error logs */
            infoLog = fs.readFileSync(config.INFO_LOG)
                .toString();
            errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString();
            expect(infoLog.includes('Error Code'), 'error code printed')
                .to.be.true;
            expect(errorLog.includes('Error Code'), 'error code printed')
                .to.be.true;

            /* error stack */

            /* test that error stack logged to console.log */
            expect(capturedConsoleLog.includes('Error Stacktrace'),
                'error stack logged')
                .to.be.true;

            /* error stack dumped to both info and error logs */
            infoLog = fs.readFileSync(config.INFO_LOG)
                .toString();
            errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString();
            expect(infoLog.includes('Error Stacktrace'), 'error stack printed')
                .to.be.true;
            expect(errorLog.includes('Error Stacktrace'), 'error stack printed')
                .to.be.true;

            /* clear and start intercepting console.log again */
            capturedConsoleLog = '';
            unhookIntercept = intercept(function(txt) {

                capturedConsoleLog += txt;

            });

            /* dump the same error */
            dumpError(err);

            /* stop intercepting console.log */
            unhookIntercept();

            /* test that info is not redumped */
            expect(capturedConsoleLog.includes('error already dumped'),
                'error not redumped')
                .to.be.true;
            expect(capturedConsoleLog.includes('Error Message'),
                'error not redumped')
                .to.be.false;

            /* test an error with no message, status, code */

            /* clear and start intercepting console.log again */
            capturedConsoleLog = '';
            unhookIntercept = intercept(function(txt) {

                capturedConsoleLog += txt;

            });

            /* dump a new error */
            const err2 = new Error('');
            err2.stack = undefined;
            dumpError(err2);

            /* stop intercepting console.log */
            unhookIntercept();

            /* test that info is not redumped */
            expect(capturedConsoleLog.includes('Error Message'),
                'no error message')
                .to.be.false;
            expect(capturedConsoleLog.includes('Error Status'),
                'no error status')
                .to.be.false;
            expect(capturedConsoleLog.includes('Error Code'),
                'no error code')
                .to.be.false;
            expect(capturedConsoleLog.includes('Error Stack'),
                'no error stack')
                .to.be.false;

            /* test an error string */

            /* clear and start intercepting console.log again */
            capturedConsoleLog = '';
            unhookIntercept = intercept(function(txt) {

                capturedConsoleLog += txt;

            });

            /* dump a string as error */
            dumpError('Test string');

            /* stop intercepting console.log */
            unhookIntercept();

            /* test that info is not redumped */
            expect(capturedConsoleLog.includes('Error String'),
                'string dumped')
                .to.be.true;


            /* test an null error */

            /* clear and start intercepting console.log again */
            capturedConsoleLog = '';
            unhookIntercept = intercept(function(txt) {

                capturedConsoleLog += txt;

            });

            /* dump null as error */
            dumpError(null);

            /* stop intercepting console.log */
            unhookIntercept();

            /* test that info is not redumped */
            expect(capturedConsoleLog.includes('err is null'),
                'null warning')
                .to.be.true;

        });

});
