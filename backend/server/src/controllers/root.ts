/**
 * This module passes all requests to the index.html file built by the Angular app.
 */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* dependencies */
import express from 'express';
import path from 'path';

export const router = express.Router();

/* send anything not found on static server to angular app to enable refreshing of internal pages */
router.get('*', (req, res, _next) => {
  const filepath = path.join(req.app.locals.config.APP_PATH, 'index.html');
  res.sendFile(filepath);
});
