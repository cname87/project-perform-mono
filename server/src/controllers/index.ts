'use strict';

/* This module handles requests for the root directory - '/' */

const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* dependencies */
import express from 'express';
export const router = express.Router();
import path from 'path';

/* get the index page */
router.get('/', (req, res, next) => {
  debug(modulename + ": running '/' callHandler");

  /* point to the pug file to be served */
  const config = req.app.locals.config;
  res.locals.filepath = path.join(config.PATH_VIEWS, config.INDEX_VIEW);

  /* fill pug template */
  res.locals.templateView = {
    title: 'Default',
    /* eliminate any final timestamp element in the url */
    // tslint:disable-next-line:object-literal-sort-keys
    reqPath: req.originalUrl.split('?timestamp')[1]
      ? req.originalUrl.split('?timestamp')[0]
      : req.originalUrl.split('&timestamp')[0],
    message: 'This is the root page',
    image: '/public/images/pp_running.jpg',
    linksHeading: 'List of pages',
    link1: '/tests',
    link1Text: 'Tests page',
    link1Message: 'All server tests',
    link2: '/users',
    link2Text: 'Users page',
    link2Message: 'User detail',
    link3: '/client/test',
    link3Text: 'Client tests',
    link3Message: 'Runs automated client-side server tests',
    link4: '/admin',
    link4Text: 'Admin page',
    link4Message: 'Admin only',
    link5: '/bundle',
    link5Text: 'Test SPA',
    link5Message: 'Tests the bundled js file',
  };

  /* call handler which serves the denoted file */
  req.app.locals.handles.returnFile(req, res, next);
});

/* use the tests router for /tests/* requests
 * includes all server functionality tests */
router.use('/tests', (req, res, next) => {
  req.app.locals.controllers.tests(req, res, next);
});

/* handle requests for client-side files */
router.use('/client', (req, res, next) => {
  req.app.locals.controllers.client(req, res, next);
});

/* handle requests for users' files */
router.use('/users', (req, res, next) => {
  req.app.locals.controllers.users(req, res, next);
});

/* handle requests for admin */
router.use('/admin', (req, res, next) => {
  req.app.locals.controllers.admin(req, res, next);
});

/* handle requests for the the test bundle file */
router.use('/bundle', (req, res, next) => {
  req.app.locals.controllers.bundle(req, res, next);
});

/* handle /raiseEvent */
router.use('/raiseEvent', (req, res, next) => {
  req.app.locals.handles.raiseEvent(req, res, next);
  res.status(200);
  res.end();
});
