'use strict';

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

/* dependencies */
import auth from 'basic-auth';
import path from 'path';
import timingSafeCompare from 'tsscmp';

/**
 * Adds '.pug' to the path stored in res.locals.filepath and
 * calls returnFile handler.
 */

function returnPug(req: any, res: any, next: () => void) {
  debug('handler returnPug called');

  const pathFile = req.path.slice(-4) !== '.pug' ? req.path + '.pug' : req.path;

  debug(`${modulename}: getting ${req.path} file`);
  res.locals.filepath = path.join(req.app.locals.config.PATH_VIEWS, pathFile);
  req.app.locals.handles.returnFile(req, res, next);
}

/**
 * Calls the return file handler to return the file associated with
 * the full request url path.
 * Note: The path used is the full url (excluding any query string).
 * Note: Any error handling is left to the return file handler.
 */

function getUrlPathFile(req: any, res: any, next: () => void) {
  debug(modulename + ': handler getUrlPathFile called');

  res.locals.filepath = path.join(
    req.app.locals.config.ROOT_PATH,
    req.baseUrl,
    req.path,
  );

  debug(modulename + ': path to file: ' + res.locals.filepath);
  req.app.locals.handles.returnFile(req, res, next);
}

/**
 * This sends a file whose path, name and extension is given
 * in res.locals.filepath.
 * It renders a pug file if the file extension is .pug and
 * res.locals.templateView is sent as the pug template properties object.
 * Otherwise, the file is sent using res.sendFile().
 * Returns a 404 http error if the file is not found.
 */

function returnFile(_req: any, res: any, next: (x: any) => void) {
  debug(modulename + ': handler returnFile was called');

  const filepath = res.locals.filepath;
  const fileext = path.extname(filepath);
  debug(modulename + ': path to file ' + filepath);

  /* call render view if file supplied is in the views directory*/
  /* otherwise send it using res.sendFile() */
  if (fileext === '.pug') {
    res.render(filepath, res.locals.templateView, (err: any, html: string) => {
      if (err) {
        /* err has no status - create a 404 status code */
        err.status = 404;
        next(err);
      } else {
        debug(modulename + ': sent: ' + filepath);
        res.end(html);
      }
    });
  } else {
    res.sendFile(filepath, (err: IErr) => {
      if (err) {
        /* 404 status error applied even if another status returned
         * e.g. if a directory was specified, 500 would be returned */
        err.status = 404;
        next(err);
      } else {
        debug(modulename + ': sent: ' + filepath);
        res.end();
      }
    });
  }
}

/**
 * Checks credentials sent in authorization header against
 * a database of users each containing a unique name and associated
 * password.
 * If an authorization header is not received, a name/password prompt screen
 * is presented until the user enters same or presses cancel.
 * Note: Currently we simulate a database lookup by comparing
 * both name and password against res.locals.user[1].
 */

function authenticate(req: any, res: any, next: () => void) {
  debug(modulename + ': handler authenticate was called.');

  /* function to validate credentials */
  function check(name: string, pass: string) {
    let valid = true;

    /* simulate reading the user name and password from a
     * database */
    const nameToCheck = res.locals.users[1].name;
    const passwordToCheck = res.locals.users[1].password;

    /* prevent short-circuit and use timing-safe compare */
    valid = timingSafeCompare(name, nameToCheck) && valid;
    valid = timingSafeCompare(pass, passwordToCheck) && valid;

    return valid;
  }

  /* parse Authorization header */
  const credentials = auth(req);
  if (!credentials || !check(credentials.name, credentials.pass)) {
    /* setting a WWW-Authenticate header */
    res.status(401);
    res.set('WWW-Authenticate', 'Basic realm="Project Perform"');
    res.send('Access Denied');
  } else {
    next();
  }
}

/**
 * Sets res.locals.setVar to the value supplied in a url query
 * of a GET or the body of a POST.
 * Does not call next() so acts as a function.
 */

function setVar(req: any, res: any) {
  debug(modulename + ': handler setVar was called');

  /* request data must be configured as 'setVar=<text>' */
  const configuredKey = 'setVar';
  const data = req.body[configuredKey] || req.query[configuredKey];
  debug(modulename + `: value uploaded: ${data}`);

  /* set the res.locals property */
  res.locals.setVar = data;
}

/**
 * This handler emits an event.
 * The event emitter is req.app.locals.event.
 * The event emitted is 'handlersRaiseEvent'.
 * The argument passed is a object with 2 properties:
 * number and message.  The values are read from the
 * request body, i.e. sent in via a POST.
 * A response is sent with a status of 200.
 * Note: There is no checking of the request body data.
 * Note: Does not call next() so acts as a function.
 * @param req http request.
 * @param res http response.
 */

function raiseEvent(req: any, _res: any) {
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
}

/* export the list of available request handlers */
export const handlers = {} as any;
handlers.returnPug = returnPug;
handlers.getUrlPathFile = getUrlPathFile;
handlers.returnFile = returnFile;
handlers.authenticate = authenticate;
handlers.setVar = setVar;
handlers.raiseEvent = raiseEvent;
