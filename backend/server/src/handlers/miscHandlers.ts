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
import { Response } from 'express';

/**
 * Import local types
 */
import { IRequestApp } from '../configServer';

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
 * This handler sends a JSON payload in a response
 */
const writeJson = (res: Response, code: number, payload?: object) => {
  res.status(code);
  res.json(payload);
};

/* export the list of available request handlers */
export const miscHandlers = {
  raiseEvent,
  writeJson,
};
