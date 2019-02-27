/**
 * This module handles requests for .../fail.
 * It is to test server fail scenarios.
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* dependencies */
import express from 'express';
export const router = express.Router();
import asyncHandler from 'express-async-handler';
import createError from 'http-errors';
import { MongoError } from 'mongodb';

/**
 * Tests various error scenarios: If the url query matches...
 * - 'fail=coffee' then it returns the 'coffee' error code (418)
 * i.e. this tests setting an error status code.
 * - 'sent' then it sends a response and calls next() - no further
 * response should be sent by the error handler.
 * - 'fail=error' then it throws an error.
 * - 'fail=crash' then it shuts the process.
 *
 * @throws see above.
 *
 */

router.get('/', (req, res, next) => {
  debug(modulename + ': running an error scenario');

  /* Throws an unhandled promise rejection - tested below */
  async function asyncFail(_req: any, _res: any, _next: () => void) {
    debug(modulename + ': throwing an unhandled rejection');
    await Promise.reject(
      createError(501, 'Testing trapped ' + 'unhandled promise rejection'),
    );
  }

  /* set true to enable server test paths */
  req.app.set('test', true);

  /* read url query */
  switch (req.query.fail) {
    case '404-prod':
      debug(modulename + ": creating 404 error - 'production' mode");
      /* testing 'production' mode' */
      req.app.set('env', 'production');
      return next(createError(404, 'Test: Page not found!'));
    case '404-dev':
      debug(modulename + ": creating 404 error - 'development' mode");
      /* testing 'development' mode' */
      req.app.set('env', 'development');
      return next(createError(404, 'Test: Page not found!'));
    case 'coffee':
      debug(modulename + ': coffee requested - sending a 418 code');
      req.app.set('env', 'production');
      return next(createError(418, "Test: I'm a teapot!"));
    case 'sent':
      debug(modulename + ': testing sending a response and calling next()');
      req.app.set('env', 'production');
      res.status(200);
      res.send('Test: Response sent');
      /* call next(err) even though response sent */
      return next(createError(503, 'Test: next(503) after headers sent'));
    case 'trap-503':
      debug(
        modulename + ': testing trapping an error and assigning an error code',
      );
      req.app.set('env', 'production');
      throw new MongoError(modulename + ': Test error');
    case 'async-handled':
      debug(modulename + ': testing a trapped promise rejection');
      req.app.set('env', 'production');
      return asyncHandler(asyncFail)(req, res, next);
    case 'error':
      /* test throwing an error, with nothing sent */
      debug(modulename + ': throwing a test error');
      req.app.set('env', 'production');
      throw new Error(modulename + ': Test error');
    case 'async':
      /* test an unhandled rejection - will trigger a shutdown*/
      debug(modulename + ': generating an unhandled rejection');
      req.app.set('env', 'production');
      /* test sending a response before error */
      res.status(200);
      res.send(
        'Test: ' + 'Server shutting down due to unhandled promise rejection',
      );
      return Promise.reject(
        new Error(modulename + ': Test unhandled promise rejection'),
      );
    case 'renderError':
      debug(modulename + ': testing a view render error');
      req.app.set('env', 'production');
      /* stub res.render to create a callback error */

      const stub = (
        _view: string,
        _options?: object | undefined,
        cb?: (err: Error, html: string) => void | undefined,
      ): void => {
        const err = new Error(modulename + ': Test error');
        const html = '';
        if (cb) {
          cb(err, html);
        }
      };
      res.render = stub;
      /* throw an error to call the errorhandling */
      throw new Error(modulename + ': Test error');
    case 'crash':
      debug(modulename + ': forcing server process exit(-1)');
      req.app.set('env', 'production');
      res.status(200);
      res.send('Test: ' + 'Server shutting down due to process.exit');
      return process.exit(-1);
    default:
      debug(modulename + ': /fail query not sent or not recognised');
      return next(createError(404, '/fail query not sent or not recognised'));
  }
});
