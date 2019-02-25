/**
 * This module supplies handler functions used across different
 * controllers.
 * It exports a handles object containing all handles.
 * The handles object is injected downstream from index.js.
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/**
 * This handler emits an event.
 * The event emitter is req.app.locals.event.
 * The event emitted is 'handlersRaiseEvent'.
 * The argument passed is a object with 2 properties:
 * number and message.  The values are read from the
 * request body, i.e. sent in via a POST.
 * A response is sent with a status of 200.
 * Note: There is no checking of the request body data..
 */

function raiseEvent(req: any, res: any, _next: any) {
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
  const event = req.app.locals.event;
  event.emit('handlersRaiseEvent', arg);

  res.status(200);
  res.end();
}

/* export the list of available request handlers */
export const handlers = {} as any;
handlers.raiseEvent = raiseEvent;
