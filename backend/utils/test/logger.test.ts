const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction = require('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* dummy import to avoid vscode error (?) 'Cannot find __filename' */
import 'basic-auth';

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

/* external dependencies */
import appRootObject = require('app-root-path');
const appRoot = appRootObject.toString();
import fs from 'fs';
import path = require('path');
import proxyquire = require('proxyquire');
import util = require('util');
const sleep = util.promisify(setTimeout);
import intercept = require('intercept-stdout');

/* configuration file expected in application root directory */
import { loggerConfig } from '../src/configUtils';
const copyLoggerConfig = {
  INFO_LOG: loggerConfig.INFO_LOG,
  ERROR_LOG: loggerConfig.ERROR_LOG,
};

/* paths for proxyquire */
const loggerPath = '../src/logger';

describe('logger', () => {
  debug(`Running ${modulename}: describe - logger`);

  after('Delete test log files & reset loggerConfig', () => {
    debug(`Running ${modulename}: after - Delete test log files & reset loggerConfig`);

    /* files only deleted when all hard links closed,
     * i.e. when programme closes */
    try {
      fs.unlinkSync(loggerConfig.INFO_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    try {
      fs.unlinkSync(loggerConfig.ERROR_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    /* reset loggerConfig */
    loggerConfig.INFO_LOG = copyLoggerConfig.INFO_LOG;
    loggerConfig.ERROR_LOG = copyLoggerConfig.ERROR_LOG;
  });

  it('logs to standard files', async () => {
    debug(
      `Running ${modulename}: it - logs to the standard files`,
    );

    /* use proxyquire to reload Logger */
    const { Logger } = proxyquire(loggerPath, {});
    const logger = Logger.getInstance();

    /* log at error level */
    logger.error('LOGGER_ERROR');

    /* read both log files */
    let infoLog = fs.readFileSync(loggerConfig.INFO_LOG).toString();
    let errorLog = fs.readFileSync(loggerConfig.ERROR_LOG).toString();

    /* allow logger print to file */
    await sleep(100);

    /* both files have output */
    infoLog = fs
      .readFileSync(loggerConfig.INFO_LOG)
      .toString()
      .slice(-14);
    errorLog = fs
      .readFileSync(loggerConfig.ERROR_LOG)
      .toString()
      .slice(-14);
    expect(infoLog === 'LOGGER_ERROR\r\n', 'info log file addition').to.be.true;
    expect(errorLog === 'LOGGER_ERROR\r\n', 'error log file entry').to.be.true;
  });

  it('creates and logs to files - development', async () => {
    debug(
      `Running ${modulename}: it - creates and logs to files (development)`,
    );

    /* set up test log files */
    // it is assumed process.env.NODE_ENV = 'development'
    loggerConfig.INFO_LOG = path.join(
      appRoot,
      'utils',
      'logs',
      'loggerInfoTest.log',
    );
    loggerConfig.ERROR_LOG = path.join(
      appRoot,
      'utils',
      'logs',
      'loggerErrorTest.log',
    );

    /* delete the test log files */
    try {
      fs.unlinkSync(loggerConfig.INFO_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    try {
      fs.unlinkSync(loggerConfig.ERROR_LOG);
    } catch (err) {
      /* ok - file didn't exist */
    }

    /* use proxyquire to reload Logger */
    const { Logger } = proxyquire(loggerPath, {});
    const logger = Logger.getInstance();

    /* both log files should be empty */
    let infoLog = fs.readFileSync(loggerConfig.INFO_LOG).toString();
    let errorLog = fs.readFileSync(loggerConfig.ERROR_LOG).toString();
    expect(infoLog.length === 0, 'info log file to be empty').to.be.true;
    expect(errorLog.length === 0, 'error log file to be empty').to.be.true;

    /* start intercepting console.log */
    let capturedConsoleLog = '';
    const unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });
    /* log at info level */
    logger.info('LOGGER_INFO');

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that it logged to console.log */
    expect(capturedConsoleLog === '', 'console.log output exists').to.be.false;

    /* allow logger print to file */
    await sleep(100);

    /* only info log should have output */
    infoLog = fs
      .readFileSync(loggerConfig.INFO_LOG)
      .toString()
      .slice(-13);
    errorLog = fs.readFileSync(loggerConfig.ERROR_LOG).toString();
    expect(infoLog === 'LOGGER_INFO\r\n', 'info log file to have an entry').to
      .be.true;
    expect(errorLog.length === 0, 'error log file to be empty').to.be.true;

    /* log at error level */
    logger.error('LOGGER_ERROR');

    /* allow logger print to file */
    await sleep(100);

    /* info log has extra output, and error log has output */
    infoLog = fs
      .readFileSync(loggerConfig.INFO_LOG)
      .toString()
      .slice(-14);
    errorLog = fs
      .readFileSync(loggerConfig.ERROR_LOG)
      .toString()
      .slice(-14);
    expect(infoLog === 'LOGGER_ERROR\r\n', 'info log file addition').to.be.true;
    expect(errorLog === 'LOGGER_ERROR\r\n', 'error log file entry').to.be.true;
  });

  it('logs to existing files - production', async () => {
    debug(`Running ${modulename}: it - logs to existing files (production)`);

    /* set up env variable and test log files */
    process.env.NODE_ENV = 'production';
    loggerConfig.INFO_LOG = path.join(
      appRoot,
      'utils',
      'logs',
      'loggerInfoTest.log',
    );
    loggerConfig.ERROR_LOG = path.join(
      appRoot,
      'utils',
      'logs',
      'loggerErrorTest.log',
    );

    /* NOTE: test log files already exist from 1st test */

    /* use proxyquire to reload Logger */
    const { Logger } = proxyquire(loggerPath, {});

    /* create a new logger */
    const logger = Logger.getInstance();

    /* start intercepting console.log*/
    let capturedConsoleLog = '';
    const unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });
    /* log at info level */
    logger.info('LOGGER_INFO2');

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that it didn't log to console.log */
    expect(capturedConsoleLog === '', 'no console.log output').to.be.true;

    /* allow logger print to file */
    await sleep(100);

    /* only info log should have added output */
    let infoLog = fs
      .readFileSync(loggerConfig.INFO_LOG)
      .toString()
      .slice(-14);
    let errorLog = fs
      .readFileSync(loggerConfig.ERROR_LOG)
      .toString()
      .slice(-14);
    expect(infoLog === 'LOGGER_INFO2\r\n', 'info log file to have a new entry')
      .to.be.true;
    expect(
      errorLog === 'LOGGER_INFO2\r\n',
      'error log file not to have a new entry',
    ).to.be.false;

    /* log at error level */
    logger.error('LOGGER_ERROR2');

    /* allow logger print to file */
    await sleep(100);

    /* info log has extra output, and error log has output */
    infoLog = fs
      .readFileSync(loggerConfig.INFO_LOG)
      .toString()
      .slice(-15);
    errorLog = fs
      .readFileSync(loggerConfig.ERROR_LOG)
      .toString()
      .slice(-15);
    expect(infoLog === 'LOGGER_ERROR2\r\n', 'info log file to have a new entry')
      .to.be.true;
    expect(
      errorLog === 'LOGGER_ERROR2\r\n',
      'error log file to have a new entry',
    ).to.be.true;
  });

  it('should test fs writeFileSync throwing an unexpected error', async function runTest() {
    debug(
      `Running ${modulename}: it - creates and logs to test files (production)`,
    );

    /* set up env variable and test log files */
    loggerConfig.INFO_LOG = path.join(appRoot, 'utils', 'logs', 'loggerInfoTest.log');
    loggerConfig.ERROR_LOG = path.join(appRoot, 'utils', 'logs', 'loggerErrorTest.log');

    /* NOTE: no need to delete the test log files as the stub
     * will throw an error */

    /* create a new logger stubbing fs.writeFileSync
     * - will fail on info log writeFileSync */
    try {
      const { Logger } = proxyquire(loggerPath, {
        fs: {
          writeFileSync: (
            file: string,
            text: string,
            flag: fs.WriteFileOptions,
          ) => {
            if (file === loggerConfig.INFO_LOG) {
              throw new Error('Test error');
            } else {
              fs.writeFileSync(file, text, flag);
            }
          },
        },
      });

      /* create a new logger */
      const logger = Logger.getInstance();
      util.inspect(logger);

      expect.fail(true, false, 'Should not reach here');
    } catch (err) {
      expect(err.message === 'Test error', 'logger creation fail').to.be.true;
    }
  });
});
