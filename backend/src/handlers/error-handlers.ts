/**
 * This module handles errors, i.e. errors passed via the Express
 * error-handling mechanism.  It also handles requests that pass
 * through without a route being identified.
 */

import { setupDebug } from '../utils/src/debugOutput';
export const { modulename, debug } = setupDebug(__filename);

/**
 * Import external dependencies
 */
import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import urlParser from 'url';
import util from 'util';

/**
 * Catches any request that passes through all middleware
 * to this point without error and creates a 'Not Found' error.
 * Note: This does not catch errors but rather requests that get this far.
 */

function notFound(_req: Request, _res: Response, next: NextFunction) {
  debug(modulename + ': notFound called');
  next(createError(404));
}

/**
 * Catches all errors.
 * Asssigns a HTTP error code to res.statusCode.
 * A code is assigned to communicate a message to the client.
 * Note: Errors left with code 500 (Internal Server Error) trigger a uncaught
 * exception in the final errorhandling function.
 */

function assignCode(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  debug(modulename + ': assignCode called');

  if (typeof err !== 'object') {
    err = new Error(String(err));
  }

  /* set the response status code to the error statusCode field, if one was added on error creation, or if one was added above. */
  res.statusCode = err.statusCode ? err.statusCode : res.statusCode;
  /* if empty, set the response code to internal server error, 500. */
  res.statusCode = res.statusCode ? res.statusCode : 500;
  /* if 20x, set the response code to internal server error, 500. */
  res.statusCode =
    res.statusCode < 200 || res.statusCode > 299 ? res.statusCode : 500;

  /* set mandatory header for 401 */
  if (res.statusCode === 401) {
    res.setHeader(
      'WWW-Authenticate',
      'OAuth realm="Access to team members API", charset="UTF-8"',
    );
  }

  next(err);
}

/**
 * Log detail on all errors passed in.
 */
function logError(err: any, req: Request, res: Response, next: NextFunction) {
  debug(modulename + ': logError started');

  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  logger.error(
    modulename + ': Logging detail on the request that caused the error',
  );

  logger.error(
    modulename +
      ': http request detail:' +
      '\nreq.url: ' +
      req.url +
      '\nreq.ip: ' +
      req.ip +
      '\nreq.method: ' +
      req.method +
      '\nurl query string: ' +
      urlParser.parse(req.originalUrl).search +
      '\nbody query string: ' +
      util.inspect(req.query) +
      '\nsigned cookies: ' +
      util.inspect(req.signedCookies) +
      '\nResponse http status code: ' +
      res.statusCode,
  );

  /* dump the error */
  dumpError(err);

  next(err);
}

/**
 * Sends a response to the client with status code and message.
 */

function sendErrorResponse(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  /* set response */
  const message = {
    code: res.statusCode,
    message: err.message,
  };

  /* check that response not already sent */
  /* Note: swagger response validation fail will have set headers */
  if (!res.headersSent) {
    /* send the error response */
    res.status(res.statusCode).json(message);
  } else {
    /* send nothing if headers already sent */
    debug(
      modulename + ': not sending a client response as headers already sent',
    );
    /* override 404 res.statusCode as 404 will be returned if a next is called in error after headers have been sent */
    res.statusCode = res.statusCode === 404 ? 500 : res.statusCode;
  }

  next(err);
}

/**
 * Emits an uncaught exception if the error code is 500 or 503, (unless the environment variable TEST_PATHS === 'true).
 * This causes the application to exit.  The GCP host restarts the application and captures and reports the error.
 * If I have assigned anything other than 500 or 503, I understand the error and do not need to close the server.
 * If I assign the code 500 then we had an unexpected server error and I then stop the server by throwing an unhandled error (which GCP should restart).
 * If I assign the code 503 then a backend service (i.e. the database server) was not available and I stop the server by throwing an unhandled error (which GCP should restart, which should then attempt to reconnect to the database server).
 */

function throwError(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  debug(modulename + ': throwError called');

  /* throw an exception */
  if (res.statusCode === 500 || res.statusCode === 503) {
    debug(modulename + ': throwing an exception to shut server');
    /* reset the server after a delay to allow error data be sent */
    setTimeout(() => {
      if (process.env.TEST_PATHS === 'true') {
        debug(
          modulename +
            ': *** In test mode => blocking an error from been thrown ***',
        );
      } else {
        /* will be caught by express final handler and not my uncaughtException handler */
        throw err;
      }
    }, 1000);
  } else {
    debug(modulename + ': not 500 or 503 (or testing) - not throwing an error');
  }

  next();
}

/* export object with all error handling functions */
export const errorHandlers = {
  notFound,
  assignCode,
  logError,
  sendErrorResponse,
  throwError,
};
