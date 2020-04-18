/**
 * This module runs a http(s) server.
 * The base controllers, handlers and an object containing the database
 * connection, servers and express app are passed in.
 * It loads common express middleware and responds to
 * incoming web requests by calling the appropriate routing functions.
 * - It calls some test functions when configured appropriately.
 * - It calls an api handler for urls matching the api base path.
 * - It loads the Angular static files from a configured directory.
 * - It loads error handlers to handle errors.
 * Note: The GCP host is expected to supply a request logger so none is provided.
 */

/* external dependencies */
import path from 'path';
import compression from 'compression';
import express, { Application } from 'express';
import urlParser from 'url';
import util from 'util';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/**
 * Sets up express middleware and responds to incoming requests.  See the module description.
 * @param app The express app object
 * @returns Void.
 */

async function runServer(app: Application) {
  debug(`${modulename}: running runServer`);

  const instanceStarted = new Date().toUTCString();

  /* GCP warmup request */
  app.get('/_ah/warmup', (_req, res, _next) => {
    debug(
      `${modulename}: _ah/warmup: Instance started (UTC): ${instanceStarted}`,
    );
    res.status(200).end();
  });

  /* GCP app engine cron job */
  app.get('/gcpCron', (_req, res, _next) => {
    debug(`${modulename}: gcpCron: Instance started (UTC): ${instanceStarted}`);

    const { configServer, database, logger, dumpError } = app.appLocals;

    debug(`${modulename}: calling database ping`);
    /* if ping returns within a configured time then no error is logged */
    let isRestartRequired = true;
    const ping = database.dbConnection.db.command({ ping: 1 });
    ping
      .then((result) => {
        const pingReturn = result.ok === 1 ? 'ok' : 'an unexpected value';
        debug(`${modulename}: database ping returned \'${pingReturn}\'`);
        isRestartRequired = false;
        res.status(200).json({
          started: instanceStarted,
        });
      })
      .catch((err) => {
        /* rely on 'disconnect' event handling to restart the server - just log an error here for diagnostic purposes */
        logger.error(`${modulename}: database ping returned an error`);
        return dumpError(err);
      });
    setTimeout(async () => {
      if (isRestartRequired) {
        /* rely on 'disconnect' event handling to restart the server - just log an error here for diagnostic purposes */
        logger.error(`${modulename}: database ping failed to return`);
      }
    }, configServer.DB_PING_TIME);
  });

  /* use strong etag validation */
  app.set('etag', 'strong');
  /* /Foo different to /foo */
  app.set('case sensitive routing', true);
  /* /admin the same as /admin/ */
  app.set('strict routing', false);
  /* compress files before sending */
  app.use(compression());

  /* parse incoming request body object as a JSON object */
  app.use(express.json());

  /* GCP app engine operates behind a proxy */
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
  }

  /* log basic information from the request */
  if (debug.enabled) {
    app.use((req, _res, next) => {
      debug(`${modulename}: *** Request received ***`);
      debug(`${modulename}: req.url: ${req.url}`);
      debug(`${modulename}: req.baseUrl: ${req.baseUrl}`);
      debug(`${modulename}: req.originalUrl: ${req.originalUrl}`);
      debug(`${modulename}: req.method: ${req.method}`);
      debug(
        `${modulename}: url query string: ${
          urlParser.parse(req.originalUrl).search
        }`,
      );
      debug(`${modulename}: body query string: ${util.inspect(req.query)}`);
      debug(`${modulename}: body: ${util.inspect(req.body)}`);
      debug(
        `${modulename}: signed cookies: ${util.inspect(req.signedCookies)}`,
      );
      next();
    });
  }

  /* test functionality only */
  if (process.env.TEST_PATHS === 'true') {
    /* serve server test files (e.g. api-loadMocha.html) from a static server mounted on /testServer */
    const staticTestOptions = {
      redirect: false,
    };
    app.use(
      '/testServer',
      express.static(
        app.appLocals.configServer.STATIC_TEST_PATH,
        staticTestOptions,
      ),
    );
    /* serve node_modules files from a static server mounted on /node_modules so mocha etc can be loaded by the browser for client-fired tests */
    app.use(
      '/node_modules',
      express.static(
        app.appLocals.configServer.NODE_MODULES_PATH,
        staticTestOptions,
      ),
    );

    /* respond to a request asking whether test database is in use */
    app.use('/testServer/isTestDatabase', (_req, res, _next) => {
      debug(`${modulename}: calling isTestDatabase`);
      const result = {
        isTestDatabase:
          app.appLocals.database.dbConnection.db.databaseName ===
          app.appLocals.configDatabase.DB_DATABASE_TEST,
      };
      res.status(200).json(result);
    });

    /* use fail controller to test errorhandling */
    app.use('/testServer/fail', (req, res, next) => {
      debug(`${modulename}: calling the fail controller`);
      app.appLocals.controllers.fail(req, res, next);
    });

    /* respond to posted raiseEvents from test pages */
    app.post('/raiseEvent', (req, res, next) => {
      debug(`${modulename}: calling raiseEvent handler`);
      app.appLocals.handlers.miscHandlers.raiseEvent(req, res, next);
    });
  }

  /* calls a api handler */
  app.use(
    /* use for api paths only */
    app.appLocals.configServer.API_BASE_PATH,
    (req, res, next) => {
      debug(`${modulename}: calling the api controller`);
      app.appLocals.controllers.api(req, res, next);
    },
  );

  /* serve the angular files */
  const staticAppOptions = {
    maxAge: '1d',
    redirect: false,
  };
  app.use(
    express.static(
      app.appLocals.configServer.CLIENT_APP_PATH,
      staticAppOptions,
    ),
  );

  /* present the angular index.html page for anything not routed by angular */
  app.use((req, res, next) => {
    /* skip /dummyUrl for server test purposes */
    if (process.env.TEST_PATHS && req.path.slice(0, 9) === '/dummyUrl') {
      next();
    } else {
      const filepath = path.join(
        app.appLocals.configServer.CLIENT_APP_PATH,
        'index.html',
      );
      debug(`${modulename} : serving index.html for an unknown path`);
      res.sendFile(filepath);
    }
  });

  /* handle all errors passed down */
  app.use(app.appLocals.handlers.errorHandlers.notFound);
  app.use(app.appLocals.handlers.errorHandlers.assignCode);
  app.use(app.appLocals.handlers.errorHandlers.logError);
  app.use(app.appLocals.handlers.errorHandlers.sendErrorResponse);
  app.use(app.appLocals.handlers.errorHandlers.throwError);
}

export { runServer };
