'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('logger tests', function() {

    /* logger utility */
    const path = require('path');
    const appRoot = require('app-root-path').toString();
    const loggerPath = '../dist/utils/logger';
    /* configuration file expected in application root directory */
    const { config: configOriginal } = require(path.join(appRoot, 'dist', '.config'));
    /* create a copy of config that you can edit */
    const config = {};
    let key = '';
    for (key in configOriginal) {

        if (configOriginal.hasOwnProperty(key)) {

            config[key] = configOriginal[key];

        }

    };

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

    /* use proxyquire to reload Logger */
    const { Logger } = proxyquire(loggerPath, {});

    before('Set up', function() {

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

    it('should create and log to test log files - development',
        async function runTest() {

            /* set up env variable and test log files */
            config.ENV = 'development';
            config.INFO_LOG = path.join(appRoot, 'logs', 'infoTest.log');
            config.ERROR_LOG = path.join(appRoot, 'logs', 'errorTest.log');

            /* delete the test log files */
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

            /* create a new logger (replacing the one created in
            booting mocha) */
            const logger =Logger.getInstance(config);

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
            const unhookIntercept = intercept(function(txt) {

                capturedConsoleLog += txt;

            });
            /* log at info level */
            logger.info('LOGGER_INFO');

            /* stop intercepting console.log */
            unhookIntercept();

            /* test that it logged to console.log */
            expect(capturedConsoleLog === '', 'console.log output exists')
                .to.be.false;

            /* allow logger print to file */
            await sleep(100);

            /* only info log should have output */
            infoLog = fs.readFileSync(config.INFO_LOG)
                .toString().slice(-13);
            errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString();
            expect(infoLog === 'LOGGER_INFO\r\n',
                'info log file to have an entry')
                .to.be.true;
            expect(errorLog.length === 0, 'error log file to be empty')
                .to.be.true;

            /* log at error level */
            logger.error('LOGGER_ERROR');

            /* allow logger print to file */
            await sleep(100);

            /* info log has extra output, and error log has output */
            infoLog = fs.readFileSync(config.INFO_LOG)
                .toString().slice(-14);
            errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString().slice(-14);
            expect(infoLog === 'LOGGER_ERROR\r\n', 'info log file addition')
                .to.be.true;
            expect(errorLog === 'LOGGER_ERROR\r\n', 'error log file entry')
                .to.be.true;

        });

    it('should log to existing test log files - production',
        async function runTest() {

            /* set up env variable and test log files */
            config.ENV = 'production';
            config.INFO_LOG = path.join(appRoot, 'logs', 'infoTest.log');
            config.ERROR_LOG = path.join(appRoot, 'logs', 'errorTest.log');

            /* NOTE: test log files already exist from 1st test */

            /* use proxyquire to reload Logger */
            const { Logger } = proxyquire(loggerPath, {});

            /* create a new logger */
            const logger = Logger.getInstance(config);

            /* start intercepting console.log*/
            let capturedConsoleLog = '';
            const unhookIntercept = intercept(function(txt) {

                capturedConsoleLog += txt;

            });
            /* log at info level */
            logger.info('LOGGER_INFO2');

            /* stop intercepting console.log */
            unhookIntercept();

            /* test that it didn't log to console.log */
            expect(capturedConsoleLog === '', 'no console.log output')
                .to.be.true;

            /* allow logger print to file */
            await sleep(100);

            /* only info log should have added output */
            let infoLog = fs.readFileSync(config.INFO_LOG)
                .toString().slice(-14);
            let errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString().slice(-14);
            expect(infoLog === 'LOGGER_INFO2\r\n',
                'info log file to have a new entry')
                .to.be.true;
            expect(errorLog === 'LOGGER_INFO2\r\n',
                'error log file not to have a new entry')
                .to.be.false;

            /* log at error level */
            logger.error('LOGGER_ERROR2');

            /* allow logger print to file */
            await sleep(100);

            /* info log has extra output, and error log has output */
            infoLog = fs.readFileSync(config.INFO_LOG)
                .toString().slice(-15);
            errorLog = fs.readFileSync(config.ERROR_LOG)
                .toString().slice(-15);
            expect(infoLog === 'LOGGER_ERROR2\r\n',
                'info log file to have a new entry')
                .to.be.true;
            expect(errorLog === 'LOGGER_ERROR2\r\n',
                'error log file to have a new entry')
                .to.be.true;

        });

    it('should test fs writeFileSync throwing an unexpected error',
        async function runTest() {

            /* set up env variable and test log files */
            config.ENV = 'development';
            config.INFO_LOG = path.join(appRoot, 'logs', 'infoTest.log');
            config.ERROR_LOG = path.join(appRoot, 'logs', 'errorTest.log');

            /* NOTE: no need to delete the test log files as the stub
             * will throw an error */

            /* create a new logger stubbing fs.writeFileSync
            * - will fail on info log writeFileSync */
            try {

                const Logger = proxyquire(loggerPath, {
                    'fs': {
                        writeFileSync: (file, text, flag) => {

                            if (file === config.INFO_LOG) {

                                throw new Error('Test error');

                            } else {

                                fs.writeFileSync(file, text, flag);

                            }

                        },
                    },
                }).Logger;
                new Logger(config);
                expect.fail(true, false, 'Should not reach here');

            } catch (err) {

                expect(err.message === 'Test error', 'logger creation fail')
                    .to.be.true;

            }

        });

});
