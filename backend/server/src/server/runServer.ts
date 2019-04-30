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
import express, { Request, NextFunction, Response } from 'express';
import { OpenAPIBackend } from 'openapi-backend';
import path from 'path';
import urlParser from 'url';
import util from 'util';
import uuidv1 from 'uuid/v1';

/* internal dependencies */
import { IErr, IExpressApp, IRequestApp } from '../configServer';

/**
 * Sets up express middleware and responds to incoming requests.
 * @param app
 * The express app object
 * *** TO DO.
 * @returns Void.
 */

async function runServer(
  app: IExpressApp,
  config: any,
  controllers: any,
  errorHandlers: any,
  handles: any,
  serverLogger: any,
) {
  debug(modulename + ': running runServer');

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
  interface IRequestUuid extends Request {
    id?: string;
  }
  function assignId(req: IRequestUuid, _res: Response, next: NextFunction) {
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

  /* debug log basic information from the request */
  if (app.get('env') === 'development') {
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

  /* enable test functionality in dev mode */
  if (app.get('env') === 'development') {
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

    /* use fail controller to test errorhandling */
    app.use('/testServer/fail', (req, res, next) => {
      debug(modulename + ': calling .../fail controller');
      controllers.fail(req, res, next);
    });

    /* respond to posted raiseEvents from test pages */
    app.post('/raiseEvent', handles['raiseEvent']);
  }

  /* route paths as per the api file */
  const api = new OpenAPIBackend({
    definition: config.API_FILE,
    apiRoot: '/api-v1',
    strict: true,
    validate: true,
    withContext: true,
    ajvOpts: {
      unknownFormats: ['int32', 'string'],
      verbose: true,
    },
    handlers: {
      getIsTestDatabase: (
        context,
        req: IRequestApp,
        res: Response,
        next: NextFunction,
      ) => {
        const result = {
          isTestDatabase:
            req.app.appLocals.database.dbConnection.db.databaseName ===
            process.env.DB_DATABASE_TEST,
        };
        req.app.appLocals.miscHandlers.writeJson(
          context,
          req,
          res,
          next,
          200,
          result,
        );
      },
      getMember: (
        context,
        req: IRequestApp,
        res: Response,
        next: NextFunction,
      ) => app.appLocals.membersApi.getMember(context, req, res, next),
      getMembers: (
        context,
        req: IRequestApp,
        res: Response,
        next: NextFunction,
      ) => app.appLocals.membersApi.getMembers(context, req, res, next),
      addMember: (
        context,
        req: IRequestApp,
        res: Response,
        next: NextFunction,
      ) => app.appLocals.membersApi.addMember(context, req, res, next),
      deleteMember: (
        context,
        req: IRequestApp,
        res: Response,
        next: NextFunction,
      ) => app.appLocals.membersApi.deleteMember(context, req, res, next),
      deleteMembers: (
        context,
        req: IRequestApp,
        res: Response,
        next: NextFunction,
      ) => app.appLocals.membersApi.deleteMembers(context, req, res, next),
      updateMember: (
        context,
        req: IRequestApp,
        res: Response,
        next: NextFunction,
      ) => app.appLocals.membersApi.updateMember(context, req, res, next),
      validationFail: (
        context,
        _req: Request,
        _res: Response,
        next: NextFunction,
      ) => {
        debug(modulename + ': running validationFail');

        app.appLocals.logger.error(modulename + ': API validation fail');
        const err: IErr = {
          name: 'REQUEST_VALIDATION_FAIL',
          message: 'API validation fail',
          statusCode: 400,
          dumped: false,
        };

        if (!(context && context.validation && context.validation.errors)) {
          /* openapi-backend types require this test */
          /* unexpected error if no context.validation.errors returned */
          err.message = err.message + ': unexpected failure';
          err.statusCode = 500;
          return next(err);
        }

        /* dump detail and then strip back for the client */
        err.message =
          'API validation fail\n' + util.inspect(context.validation.errors);
        app.appLocals.dumpError(err);
        err.message = 'API validation fail';
        next(err);
      },
      notFound: async (
        /* called if path not matched - needed or an exception thrown */
        _context,
        _req: Request,
        _res: Response,
        next: NextFunction,
      ) => {
        debug(modulename + ': api handler running notFound');

        /* let angular or errorhandler deal with not founds */
        next();
      },
    },
  });

  /* initialize Openapi-backend middleware */
  api.init();

  /* openapi-backend calls a handler based on the path and the api */
  app.use((req, res, next) =>
    api.handleRequest(
      /* the first parameter is passed to openapi-backend middleware - the others are passed to the called handler function */
      {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers as { [key: string]: string | string[] },
      },
      req,
      res,
      next,
    ),
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
