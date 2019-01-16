'use strict';

/**
 * This module runs a http(s) server.
 * The base controllers, handlers and an object containing the database
 * connection, servers and express app are passed in via an objects parameter.
 * The application configuration file is also passed in.
 * It loads common express middleware and responds to
 * incoming web requests by calling the appropriate routing functions.
 * It loads the controllers, handles, objects and configuration object
 * into res.locals so they are available to every response.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import favicon from 'serve-favicon';
import urlParser from 'url';
import util from 'util';
import uuidv1 from 'uuid/v1';

/**
 * Sets up express middleware and responds to incoming requests.
 * @param app
 * The express app object
 * app.locals holds other set up objects including the array used to store
 * the https(s) servers.
 * @returns
 * Void.
 */

export async function runServer(app: express.Application) {
  debug(modulename + ': running runServer');

  const config = app.locals.config;
  const handles = app.locals.handles;
  const controllers = app.locals.controllers;
  const serverLogger = app.locals.serverLogger;

  /* 'development' or 'production' */
  app.set('env', config.ENV);
  /* default path to views for res.render */
  app.set('views', config.PATH_VIEWS);
  /* default view file extension to use (when omitted) */
  app.set('view engine', 'pug');
  /* use strong etag validation */
  app.set('etag', 'strong');
  /* /Foo different to /foo */
  app.set('case sensitive routing', true);
  /* /admin the same as /admin/ */
  app.set('strict routing', false);

  /* compress files before sending */
  app.use(compression());

  /* assign a unique id to each request */
  function assignId(req: any, _res: any, next: () => void) {
    req.id = uuidv1();
    next();
  }
  app.use(assignId);

  /* serve favicon file (before logger) */
  app.use(favicon(config.FAVICON));

  /* log simple format to default stdout */
  app.use(serverLogger.logConsole);
  /* log detailed format to file */
  app.use(serverLogger.logFile);

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

  app.use((_req, res, next) => {
    /* used to hold the filepath to the file to be returned */
    res.locals.filepath = '';
    /* used to hold the data in a query ?data=<data> */
    res.locals.setVar = '';
    /* sent with pug views in return file handler */
    res.locals.templateView = {
      image: '',
      message: '',
      reqPath: '',
      title: '',
      /* all other properties = undefined */
    };
    /* simulated users database */
    res.locals.users = {
      1: {
        userId: 113,
        // tslint:disable-next-line:object-literal-sort-keys
        name: 'testName',
        password: 'testPassword',
        email: 'test@test.com',
      },
      2: {
        userId: 124,
        // tslint:disable-next-line:object-literal-sort-keys
        name: '',
        password: 'test2Password',
        email: 'test2@test.com',
      },
    };
    /* identified user */
    res.locals.user = {};

    next();
  });

  /* debug log basic information from the request */
  app.use(function debugRequest(req, _res, next) {
    debug('\n' + modulename + ': *** Request received ***\n');
    debug(modulename + ': req.url: ' + req.url);
    debug(modulename + ': re.baseUrl: ' + req.baseUrl);
    debug(modulename + ': req.originalUrl: ' + req.originalUrl);
    debug(modulename + ': req.method: ' + req.method);
    debug(
      modulename +
        ': url query string: ' +
        urlParser.parse(req.originalUrl).search,
    );
    debug(modulename + ': body query string: ' + util.inspect(req.query));
    debug(modulename + ': signed cookies: ' + util.inspect(req.signedCookies));
    next();
  });

  /* set up a static server */
  /* maxAge determines how long the client caches the file */
  /* setHeaders tells the browser to prompt to download any file
   * that is in the configured download directory */
  const staticServerOptions = {
    maxAge: '1d',
    setHeaders: (res: any, path: string) => {
      if (path.indexOf(config.STATIC_SERVER_DOWNLOAD_PATH) === 0) {
        res.attachment(path);
      }
    },
  };
  app.use(
    config.STATIC_SERVER_URL,
    express.static(config.STATIC_SERVER_PATH, staticServerOptions),
  );

  /* present the index page for a request to / */
  app.use('/', controllers.root);

  /* handle all errors passed down via the error handling functionality */
  app.use(handles.errorHandler.notFound);
  app.use(handles.errorHandler.assignCode);
  app.use(handles.errorHandler.logError);
  // app.use(handles.errorHandler.sendErrorResponse);
  app.use(handles.errorHandler.throwError);
}
