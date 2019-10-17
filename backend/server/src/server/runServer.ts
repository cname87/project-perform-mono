/**
 * This module runs a http(s) server.
 * The base controllers, handlers and an object containing the database
 * connection, servers and express app are passed in via an objects parameter.
 * The application configuration file is also passed in.
 * It loads common express middleware and responds to
 * incoming web requests by calling the appropriate routing functions.
 * - It calls some test functions in development mode.
 * - It calls an api handler for urls matching the api base path.
 * - It loads the Angular static files from the configured directory.
 * - It loads error handlers to handle errors.
 * Note: The host (e.g. GCP) is expected to supply a request logger so none is provided.
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import bodyParser = require('body-parser');
import compression = require('compression');
import cookieParser = require('cookie-parser');
import express = require('express');
import { Request, NextFunction, Response } from 'express';
import urlParser = require('url');
import util = require('util');
import uuidv1 = require('uuid/v1');

/* internal dependencies */
import { IExpressApp, IControllers } from '../configServer';

/**
 * Sets up express middleware and responds to incoming requests.  See the module description.
 * @param app The express app object
 * @param config Object with server configuration parameters
 * @param controllers Route controllers
 * @param handles Request handlers
 * @returns Void.
 */

async function runServer(
  app: IExpressApp,
  config: any,
  controllers: IControllers,
  errorHandlers: any,
  handles: any,
) {
  debug(modulename + ': running runServer');

  /* GCP warmup request */
  app.use('/_ah/warmup', (_req, res, _next) => {
    res.status(200).end();
  });
  /* GCP app engine cron job */
  const started = new Date().toUTCString();
  app.get('/gcpCron', (_req, res, _next) => {
    debug(`${modulename}: gcpCron: Instance started (UTC): ${started}`);
    res.status(200).json({
      started,
    });
  });

  /* use strong etag validation */
  app.set('etag', 'strong');
  /* /Foo different to /foo */
  app.set('case sensitive routing', true);
  /* /admin the same as /admin/ */
  app.set('strict routing', false);
  /* compress files before sending */
  app.use(compression());
  /* assign a unique id to each request */
  interface IRequestUuid extends Request {
    id?: string;
  }
  function assignId(req: IRequestUuid, _res: Response, next: NextFunction) {
    req.id = uuidv1();
    next();
  }
  app.use(assignId);

  /* parse the body for 4 type options */
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: false,
    }),
  );
  app.use(bodyParser.text());
  app.use(bodyParser.raw());

  /* parse cookies to req.cookies / req.signedCookies */
  app.use(cookieParser(config.COOKIE_KEY));

  /* GCP app engine operates behind a proxy */
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
  }

  /* log basic information from the request */
  if (config.DEBUG) {
    app.use((req, _res, next) => {
      debug(modulename + ': *** Request received ***');
      debug(modulename + ': req.url: ' + req.url);
      debug(modulename + ': req.baseUrl: ' + req.baseUrl);
      debug(modulename + ': req.originalUrl: ' + req.originalUrl);
      debug(modulename + ': req.method: ' + req.method);
      debug(
        modulename +
          ': url query string: ' +
          urlParser.parse(req.originalUrl).search,
      );
      debug(modulename + ': body query string: ' + util.inspect(req.query));
      debug(modulename + ': body: ' + util.inspect(req.body));
      debug(
        modulename + ': signed cookies: ' + util.inspect(req.signedCookies),
      );
      next();
    });
  }

  /* enable test functionality in dev mode */
  if (process.env.NODE_ENV === 'development') {
    /* serve server test files from a static server mounted on /testServer */
    const staticTestOptions = {
      redirect: false,
    };
    app.use(
      '/testServer',
      express.static(config.STATIC_TEST_PATH, staticTestOptions),
    );

    /* serve node_modules files from a static server mounted on /node_modules so mocha etc can be loaded by the browser for client-fired tests */
    app.use(
      '/node_modules',
      express.static(config.NODE_MODULES_PATH, staticTestOptions),
    );

    /* respond to a request asking whether test database is in use */
    app.use('/testServer/isTestDatabase', (_req, res, _next) => {
      debug(modulename + ': calling isTestDatabase');
      const result = {
        isTestDatabase:
          app.appLocals.database.dbConnection.db.databaseName ===
          process.env.DB_DATABASE_TEST,
      };
      res.status(200).json(result);
    });

    /* use fail controller to test errorhandling */
    app.use('/testServer/fail', (req, res, next) => {
      debug(modulename + ': calling the fail controller');
      controllers.fail(req, res, next);
    });

    /* respond to posted raiseEvents from test pages */
    app.post('/raiseEvent', handles['raiseEvent']);
  }

  /* calls a handler based on the path and the api */
  app.use(
    /* use for api paths only */
    process.env.API_BASE_PATH as string,
    (req, res, next) => {
      debug(modulename + ': calling the api controller');
      controllers.api(req, res, next);
    },
  );

  /* serve the angular files */
  const staticAppOptions = {
    maxAge: '1d',
    redirect: false,
  };
  app.use(express.static(config.APP_PATH, staticAppOptions));

  /* present the angular index.html page for anything not routed by angular */
  app.use((req, res, next) => {
    /* skip /dummyUrl for server test purposes */
    if (req.path.slice(0, 9) !== '/dummyUrl') {
      const filepath = path.join(config.APP_PATH, 'index.html');
      debug(modulename + ' : serving index.html for an unknown path');
      res.sendFile(filepath);
    } else {
      next();
    }
  });

  /* handle all errors passed down via the error handling functionality */
  app.use(errorHandlers.notFound);
  app.use(errorHandlers.assignCode);
  app.use(errorHandlers.logError);
  app.use(errorHandlers.sendErrorResponse);
  app.use(errorHandlers.throwError);
}

/* export the run server function */
export { runServer };
