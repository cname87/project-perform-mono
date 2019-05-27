/**
 * This module supplies handler functions used across different
 * controllers.
 * It exports a handles object containing all handles.
 * The handles object is injected downstream from index.js.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/**
 * Import external dependencies.
 */
import { NextFunction, Response } from 'express';
import util = require('util');

/**
 * Import local types
 */
import { IRequestApp, IErr } from '../configServer';
import { Context, ValidationResult } from 'openapi-backend';

/**
 * This handler emits an even.
 * The event emitter is req.app.appLocals.event.
 * The event emitted is 'handlersRaiseEvent'.
 * The argument passed is a object with 2 properties:
 * number and message.  The values are read from the
 * request body, i.e. sent in via a POST.
 * A response is sent with a status of 200.
 * Note: There is no checking of the request body data..
 */
function raiseEvent(req: IRequestApp, res: Response) {
  debug(modulename + ': handler raiseEvent was called');

  /* retrieve data sent via POST */
  /* default to 0 and '' */
  let message = '';
  if (req.body.message) {
    message = req.body.message;
  }
  let numberToSend = '';
  if (req.body.number) {
    numberToSend = req.body.number;
  }
  const arg = {
    message,
    number: numberToSend,
  };

  /* raise an event */
  const event = req.app.appLocals.event;
  event.emit('handlersRaiseEvent', arg);

  res.status(200);
  res.end();
}

/**
 * This examines a supplied payload and result code against a supplied openapi-backend context object and returns an openapi-backend ValidationResult.
 */
const isResponseValid = (
  context: Context | undefined,
  payload: any,
  statusCode: number,
): ValidationResult => {
  debug(modulename + ': running postResponseHandler');

  if (!(context && context.operation && context.operation.responses)) {
    /* return invalid */
    return {
      valid: false,
      errors: [
        {
          keyword: 'unexpected',
          dataPath: '',
          schemaPath: '',
          params: [],
          message: 'context or operation missing in response validation call',
        },
      ],
    };
  }

  /* manual validation required if body is empty */
  if (!payload) {
    debug(modulename + ': empty body reported');

    /* match content for status code and return valid if no content -  otherwise proceed */
    const responseObject: any = context.operation.responses[statusCode];
    if (!responseObject.content) {
      return {
        valid: true,
        errors: null,
      };
    }
  }

  return context.api.validateResponse(payload, context.operation, statusCode);
};

/**
 * This handler sends a JSON payload in a response.
 */
const writeJson = (
  context: Context | undefined,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
  code: number,
  payload?: object,
) => {
  debug(modulename + ': running writeJson');

  const validationResult = isResponseValid(context, payload, code);

  if (!validationResult.valid) {
    // response validation failed
    const err: IErr = {
      name: 'RESPONSE_VALIDATION_FAIL',
      message:
        'Response validation fail error:\n' +
        util.inspect(validationResult.errors) +
        '\nResponse payload:\n' +
        util.inspect(payload),
      statusCode: 502,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    err.message = 'Response validation fail';

    next(err);
  } else {
    /* no error */
    res.status(code).json(payload);
  }
};

/* export the list of available request handlers */
export const miscHandlers = {
  raiseEvent,
  writeJson,
};
