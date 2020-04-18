import { setupDebug } from '../src/debugOutput';

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import proxyquire from 'proxyquire';
import intercept from 'intercept-stdout';
import winston from 'winston';
import Transport from 'winston-transport';

const { modulename, debug } = setupDebug(__filename);
chai.use(sinonChai);
const { expect } = chai;
sinon.assert.expose(chai.assert, {
  prefix: '',
});
const { transports } = winston;

/* set up path to logger.ts for proxyquire */
const loggerPath = '../src/logger';

describe('logger', () => {
  debug(`Running ${modulename}: describe - logger`);

  /**
   *  Set up and returns test log message detail.
   */
  function setupMessage(message: string) {
    const logMessage = message;
    return {
      logMessage,
    };
  }
  /**
   * Function to set up the logger.
   * @returns A new logger instance.
   */
  function setupLogger(stubObject = {}) {
    debug(`${modulename}: running setupLogger`);

    /* use proxyquire to reload Logger */
    const { Logger } = proxyquire(loggerPath, stubObject);
    /* create logger */
    const logger = new Logger() as winston.Logger;

    return { logger };
  }

  it('logs to console (development)', async () => {
    debug(`Running ${modulename}: it - logs to console (development)`);

    const restoreNodeDev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    debug('set up logger instance');
    const { logger } = setupLogger();

    /* start intercepting console.log */
    /* Note: no debug messages until intercept is closed */
    let capturedConsoleLog = '';
    const unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });

    /* create test log message */
    const { logMessage: infoMessage } = setupMessage('TEST_INFO_MESSAGE');

    /* log a message at the info level */
    logger.info(infoMessage);

    /* test that it logged info message to console.log */
    expect(
      capturedConsoleLog.includes(infoMessage),
      'console.log output includes info message',
    ).to.be.true;

    /* create test log message */
    const { logMessage: errorMessage } = setupMessage('TEST_ERROR_MESSAGE');

    /* log a message at the error level */
    logger.error(errorMessage);

    /* test that it logged error message to console.log */
    expect(
      capturedConsoleLog.includes(errorMessage),
      'console.log output includes error message',
    ).to.be.true;

    /* stop intercepting console.log */
    unhookIntercept();

    /* restore process.env */
    process.env.NODE_ENV = restoreNodeDev;
  });

  it('does not log to console (production)', async () => {
    debug(`Running ${modulename}: it - does not log to console (development)`);

    const restoreGaeEnv = ''; // cannot restore to 'undefined'
    process.env.GAE_ENV = 'standard';

    /* stub GCP LoggingWinton */
    const Dummy = class DummyTransport extends Transport {
      constructor(opts: any) {
        super(opts);
      }

      log = () => {
        // empty
      };
    };
    const stubObject = {
      '@google-cloud/logging-winston': {
        LoggingWinston: Dummy,
      },
    };

    debug('set up logger instance');
    const { logger } = setupLogger(stubObject);

    /* start intercepting console.log */
    /* Note: no debug messages until intercept is closed */
    let capturedConsoleLog = '';
    const unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });

    /* create test log message */
    const { logMessage: infoMessage } = setupMessage('TEST_INFO_MESSAGE');

    /* log a message at the info level */
    logger.info(infoMessage);

    /* test that it did not log info message to console.log */
    expect(
      capturedConsoleLog.includes(infoMessage),
      'console.log output does not include info message',
    ).to.be.false;

    /* create test log message */
    const { logMessage: errorMessage } = setupMessage('TEST_ERROR_MESSAGE');

    /* log a message at the error level */
    logger.error(errorMessage);

    /* test that it did not log error message to console.log */
    expect(
      capturedConsoleLog.includes(errorMessage),
      'console.log output does not include error message',
    ).to.be.false;

    /* stop intercepting console.log */
    unhookIntercept();

    /* restore process.env */
    process.env.GAE_ENV = restoreGaeEnv;
  });

  it('logs info and error to GCP (production)', async () => {
    debug(
      `Running ${modulename}: it - logs info and error to GCP (production)`,
    );

    const restoreDebug = process.env.DEBUG;
    const restoreGaeEnv = ''; // cannot restore to 'undefined'
    process.env.DEBUG = 'PP*';
    process.env.GAE_ENV = 'standard';

    debug('set up logger instance');
    /* stub GCP LoggingWinton with Console */
    const stubObject = {
      '@google-cloud/logging-winston': {
        LoggingWinston: transports.Console,
      },
    };
    const { logger } = setupLogger(stubObject);

    /* start intercepting console.log */
    /* Note: no debug messages until intercept is closed */
    let capturedConsoleLog = '';
    const unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });

    /* create test log message */
    const { logMessage: infoMessage } = setupMessage('TEST_INFO_MESSAGE');

    /* log a message at the info level */
    logger.info(infoMessage);

    /* test that it logged */
    expect(
      capturedConsoleLog.includes(infoMessage),
      'console.log output includes info message',
    ).to.be.true;

    /* create test log message */
    const { logMessage: errorMessage } = setupMessage('TEST_ERROR_MESSAGE');

    /* log a message at the error level */
    logger.error(errorMessage);

    /* test that it logged */
    expect(
      capturedConsoleLog.includes(errorMessage),
      'console.log output includes error message',
    ).to.be.true;

    /* stop intercepting console.log */
    unhookIntercept();

    /* restore process.env */
    process.env.DEBUG = restoreDebug;
    process.env.GAE_ENV = restoreGaeEnv;
  });

  it('logs error only to GCP (production)', async () => {
    debug(`Running ${modulename}: it - logs error only to GCP (production)`);

    const restoreDebug = process.env.DEBUG;
    const restoreGaeEnv = ''; // cannot restore to 'undefined'
    process.env.DEBUG = ''; // will set debug level to 'error'
    process.env.GAE_ENV = 'standard';

    debug('set up logger instance');
    /* stub GCP LoggingWinton with Console */
    const stubObject = {
      '@google-cloud/logging-winston': {
        LoggingWinston: transports.Console,
      },
    };
    const { logger } = setupLogger(stubObject);

    /* start intercepting console.log */
    /* Note: no debug messages until intercept is closed */
    let capturedConsoleLog = '';
    const unhookIntercept = intercept((txt: string) => {
      capturedConsoleLog += txt;
    });

    /* create test log message */
    const { logMessage: infoMessage } = setupMessage('TEST_INFO_MESSAGE');

    /* log a message at the info level */
    logger.info(infoMessage);

    /* test that it is not logged */
    expect(
      capturedConsoleLog.includes(infoMessage),
      'console.log output includes info message',
    ).to.be.false;

    /* create test log message */
    const { logMessage: errorMessage } = setupMessage('TEST_ERROR_MESSAGE');

    /* log a message at the error level */
    logger.error(errorMessage);

    /* test that it logged */
    expect(
      capturedConsoleLog.includes(errorMessage),
      'console.log output includes error message',
    ).to.be.true;

    /* stop intercepting console.log */
    unhookIntercept();

    /* restore process.env */
    process.env.DEBUG = restoreDebug;
    process.env.GAE_ENV = restoreGaeEnv;
  });

  it('does not log to GCP (development)', async () => {
    debug(`Running ${modulename}: it - does not log to GCP (development)`);

    const restoreNodeDev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    debug('set up logger instance');
    /* stub GCP LoggingWinton to throw an error if called */
    const stubObject = {
      '@google-cloud/logging-winston': {
        LoggingWinston: class Error {},
      },
    };
    const { logger } = setupLogger(stubObject);

    /* create test log message */
    const { logMessage: infoMessage } = setupMessage('TEST_INFO_MESSAGE');

    /* log a message at the info level */
    /* this will cause a fail if the GCP logger is called */
    logger.info(infoMessage);

    /* restore process.env */
    process.env.NODE_ENV = restoreNodeDev;
  });
});
