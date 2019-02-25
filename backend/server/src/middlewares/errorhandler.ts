/**
 * This module handles errors, i.e. errors passed via the Express
 * error-handling mechanism.  It also handles requests that pass
 * through without a route being identified.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import createError from 'http-errors';
import { MongoError } from 'mongodb';
import path from 'path';
import urlParser, { Url } from 'url';
import util from 'util';

// executes a callback when a http request closes, finishes, or errors.
// const onFinished from 'on-finished');
import * as winston from 'winston';

/* module variables */
let logger: winston.Logger;

/**
 * Catches any request that passes through all middleware
 * to this point without error and creates a 'Not Found' error.
 */

export function notFound(_req: any, _res: any, next: any) {
  debug(modulename + ': notFound called');
  next(createError(404));
}

/**
 * Asssigns a HTTP error code to res.statusCode if appropriate.
 * Note that a code is assigned to communicate a message to the client
 * in the rendered error view, and carries the notion that the error does not
 * require a system restart, apart from code 500 (Internal Server Error).
 * Errors left with code 500 (Internal Server Error) trigger a uncaught
 * exception in the final errorhandling function.
 */

export function assignCode(err: any, _req: any, res: any, next: any) {
  /* default to internal server error code if err.status does not
   * include a code */
  res.statusCode = err.status || 500;

  /* override code for specific cases */
  /* example: signal Service Unavailable (with the implication that
   * it is temporary) for a certain type of error */
  if (err instanceof MongoError) {
    res.statusCode = 503;
  }

  /* note code in error status so dumped with the error */
  err.status = res.statusCode;

  next(err);
}

/**
 * Log detail on all errors passed in.
 */

export function logError(err: any, req: any, res: any, next: any) {
  debug(modulename + ': logError started');

  logger = res.app.locals.logger;
  const dumpError = res.app.locals.dumpError;

  logger.error(modulename + ': http server logError handler called');

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
      util.inspect(req.signedCookies),
  );

  /* dump the error */
  dumpError(err);

  next(err);
}

/**
 * Sends a response to the client with some error detail if headers
 * are not already sent. The detail sent is dependent on whether
 * the environment is 'production' or not.
 */

export function sendErrorResponse(err: any, req: any, res: any, next: any) {
  /* callback from pug render below */
  function renderCallback(renderErr: any, html: string) {
    if (renderErr) {
      logger.error(modulename + ': render error - exiting');
      res.status(500);
      res.send('Internal server error');
      process.emit('thrownException', renderErr);
    } else {
      /* send the rendered html */
      res.send(html);
    }
  }

  /* function that renders the view using pug templating engine */
  function renderErrorResponse(
    msg: string,
    statCode: number,
    stk: string,
    origUrl: Url,
  ) {
    const config = res.app.locals.config;
    res.render(
      path.join(config.PATH_VIEWS, 'error'),
      {
        title: 'ERROR',
        message: msg,
        originalUrl: origUrl,
        stack: stk,
        status: statCode,
      },
      renderCallback,
    );
  }

  /* set response based on production or not */
  const message =
    res.app.get('env') === 'production' && res.statusCode === 500
      ? 'A server error occurred'
      : err.message;
  const statusCode = res.statusCode;
  const stack = res.app.get('env') === 'production' ? '' : err.stack;
  const originalUrl = req.originalUrl;

  /* check that response not already sent */
  if (!res.headersSent) {
    /* render the error response */
    renderErrorResponse(message, statusCode, stack, originalUrl);
  } else {
    /* send nothing if headers already sent */
    debug(
      modulename + ': not sending a client response as headers already sent',
    );
    /* override 404 res.statusCode as 404 will be returned if a next
     * is called in error after headers have been sent */
    res.statusCode = res.statusCode === 404 ? 500 : res.statusCode;
  }

  /* pass on so does not hang */
  next(err);
}

/**
 * Emits an uncaught exception (which stops the server) if the error code
 * is 500.  That is, if I have assigned anything other than 500, I understand
 * the error and do not need to close the error.  If I assign the code 500 I
 * am telling the client we had an unexpected server error and I then stop
 * the server (which should restart).
 */

export function throwError(err: any, _req: any, res: any, next: any) {
  debug(modulename + ': throwError called');

  if (res.statusCode === 500) {
    /* caught in index.js */
    process.emit('thrownException', err);
  }

  next();
}
