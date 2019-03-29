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
import path from 'path';
import swaggerTools = require('swagger-tools');
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

  if (app.get('env') === 'development') {
    /* debug log basic information from the request */
    app.use((req, _res, next) => {
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
      debug(modulename + 'body: ' + util.inspect(req.body));
      debug(
        modulename + ': signed cookies: ' + util.inspect(req.signedCookies),
      );
      next();
    });
  }

  /* enable test functionality in dev mode or if set by a test */
  if (app.get('env') === 'development' || app.get('test')) {
    /* serve server test files from a static server mounted on /testServer */
    const staticTestOptions = {
      redirect: false,
    };

    app.use(
      '/testServer',
      express.static(config.STATIC_TEST_PATH, staticTestOptions),
    );

    /* use fail controller to test errorhandling */
    app.use('/testServer/fail', (req, res, next) => {
      debug(modulename + ': calling .../fail controller');
      controllers.fail(req, res, next);
    });

    /* respond to posted raiseEvents from test pages */
    app.post('/raiseEvent', handles['raiseEvent']);
  }

  /* set up the swagger api handler */
  const setupSwagger = new Promise((resolve) => {
    /* swaggerRouter configuration */
    const options = {
      controllers: config.CONTROLLERS_PATH,
      /* use stubs for routes with no controller */
      useStubs: false,
    };

    /* swagger api definition */
    const swaggerDoc = require(config.API_FILE);

    /* initialize the swagger middleware */
    swaggerTools.initializeMiddleware(swaggerDoc, (middleware) => {
      /* interpret swagger resources and attach metadata to request (1st) */
      app.use(middleware.swaggerMetadata());

      // // Provide the security handlers  *** To Do ***
      // app.use(middleware.swaggerSecurity({
      //   oauth2 (req, def, scopes, callback) {
      //     // Do real stuff here
      //   },
      // }));

      /* get model for later integration using swagger-mongoose */
      const swaggerToolsTyped: any = swaggerTools;
      swaggerToolsTyped.specs.v2.composeModel(
        swaggerDoc,
        '#/definitions/Member',
        (err: any, schema: any) => {
          if (err) {
            throw err;
          }
          console.log(JSON.stringify(schema, null, '  '));
        },
      );

      /* validate swagger requests, and responses if desired */
      app.use(
        middleware.swaggerValidator({
          validateResponse: true,
        }),
      );

      /* route validated requests to appropriate controller */
      app.use(middleware.swaggerRouter(options));

      /* serve the swagger api UI at http://localhost:port/api/docs */
      app.use(
        middleware.swaggerUi({
          swaggerUi: '/api/docs',
        }),
      );

      resolve();
    });
  });

  await setupSwagger;

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
      res.sendFile(filepath);
    } else {
      next();
    }
  });

  /* handle all errors passed down via the error handling functionality */
  app.use(handles.errorHandler.notFound);
  app.use(handles.errorHandler.assignCode);
  app.use(handles.errorHandler.logError);
  app.use(handles.errorHandler.sendErrorResponse);
  app.use(handles.errorHandler.throwError);
}
