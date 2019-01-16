/**
 * This module handles all browser requests.
 * It passes the root / request to the index.html file built by the Angular app.
 * It passes all other requests to the Angular app dist directory
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* dependencies */
import express from 'express';
import path from 'path';

export const router = express.Router();

/* get the index.html page */
router.get('/', (req, res, next) => {
  debug(modulename + ": running '/' handler");

  const pathFile = 'index.html';

  debug(modulename + ": getting '" + pathFile + "' file");
  res.locals.filepath = path.join(req.app.locals.config.APP_PATH, pathFile);
  req.app.locals.handles.returnFile(req, res, next);
});

/* get the file referenced in req.path from the configured directory */
router.get('*', (req, res, next) => {
  debug(modulename + ": running '*' handler");

  const pathFile = req.path;

  debug(modulename + ": getting '" + pathFile + "' file");
  res.locals.filepath = path.join(req.app.locals.config.APP_PATH, pathFile);
  req.app.locals.handles.returnFile(req, res, next);
});
