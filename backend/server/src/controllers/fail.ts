/**
 * This module handles requests for .../fail.
 * It is to test server fail scenarios.
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import express = require('express');
const router = express.Router();
import asyncHandler = require('express-async-handler');
import createError = require('http-errors');

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
      createError(501, 'Testing trapped unhandled promise rejection'),
    );
  }

  /* read url query */
  switch (req.query.fail) {
    case 'coffee':
      debug(modulename + ': coffee requested - sending a 418 code');
      return next(createError(418, "Test: I'm a teapot!"));
    case 'sent':
      debug(modulename + ': testing sending a response and calling next()');
      res.status(200);
      const message = JSON.parse('{"message": "Test: Response sent"}');
      res.json(message);
      /* call next(err) even though response sent */
      return next(createError(503, 'Test: next(503) after headers sent'));
    case 'trap-503':
      debug(modulename + ': testing creating an error with an error code');
      const err = {
        message: 'Test error',
        statusCode: 503,
      };
      return next(err);
    case 'async-handled':
      debug(modulename + ': testing a trapped promise rejection');
      return asyncHandler(asyncFail)(req, res, next);
    case 'error':
      /* test throwing an error, with nothing sent */
      debug(modulename + ': throwing a test error');
      throw new Error(modulename + ': Test error');
    case 'async':
      /* test an unhandled rejection - will trigger a shutdown*/
      debug(modulename + ': generating an unhandled rejection');
      /* test sending a response before error */
      res.status(200);
      res.send(
        'Test: ' + 'Server shutting down due to unhandled promise rejection',
      );
      Promise.reject(
        new Error(modulename + ': Test unhandled promise rejection'),
      );
      break;
    case 'crash':
      debug(modulename + ': forcing server process exit(-1)');
      res.status(200);
      res.send('Test: ' + 'Server shutting down due to process.exit');
      return process.exit(-1);
    default:
      debug(modulename + ': /fail query not sent or not recognised');
      return next(createError(404, '/fail query not sent or not recognised'));
  }
});

export { router as failController };
