/**
 * This module handles requests for .../api-v1.
 * It is to serve all api requests.
 */

import { setupDebug } from '../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

/* external dependencies */
import { Router, Request, NextFunction, Response } from 'express';
import OpenAPIBackend from 'openapi-backend';
import util from 'util';

const router = Router();

/* initialize openapi-backend middleware */
/* this takes a long time to run => run once only for performance - called during server startup, (e.g. from GCP _ah/warmup request) so does not have to run when client makes its first call */
let api: OpenAPIBackend;
export const initOpenApi = (appLocals: Perform.IAppLocals) => {
  debug(modulename + ': running initOpenApi');
  /* route paths as per the api file */
  api = new OpenAPIBackend({
    definition: appLocals.configServer.OPENAPI_FILE,
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
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) => {
        const result = {
          isTestDatabase:
            appLocals.database.dbConnection.db.databaseName ===
            appLocals.configDatabase.DB_DATABASE_TEST,
        };
        appLocals.handlers.miscHandlers.writeJson(
          context,
          request,
          response,
          nextFunction,
          200,
          result,
        );
      },
      getMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.getMember(
          context,
          request,
          response,
          nextFunction,
        ),
      getMembers: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.getMembers(
          context,
          request,
          response,
          nextFunction,
        ),
      addMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.addMember(
          context,
          request,
          response,
          nextFunction,
        ),
      deleteMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.deleteMember(
          context,
          request,
          response,
          nextFunction,
        ),
      deleteMembers: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.deleteMembers(
          context,
          request,
          response,
          nextFunction,
        ),
      updateMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.updateMember(
          context,
          request,
          response,
          nextFunction,
        ),
      validationFail: (
        context,
        _request: Request,
        _response: Response,
        nextFunction: NextFunction,
      ) => {
        debug(modulename + ': running validationFail');

        appLocals.logger.error(modulename + ': API validation fail');
        const err: Perform.IErr = {
          name: 'REQUEST_VALIDATION_FAIL',
          message: 'API validation fail',
          statusCode: 400,
          dumped: false,
        };

        if (!(context && context.validation && context.validation.errors)) {
          /* openapi-backend types require this test */
          /* unexpected error if context.validation.errors returned */
          err.message = err.message + ': unexpected openapi error';
          err.statusCode = 500;
          return nextFunction(err);
        }

        /* dump detail and then strip back message to send to the client */
        err.message =
          'API validation fail\n' + util.inspect(context.validation.errors);
        appLocals.dumpError(err);
        err.message = 'API validation fail';
        nextFunction(err);
      },
      notFound: async (
        /* called if path not matched - needed or an exception thrown */
        _context,
        _request: Request,
        _response: Response,
        nextFunction: NextFunction,
      ) => {
        debug(modulename + ': api handler running notFound');

        /* let angular or error handler deal with not founds */
        nextFunction();
      },
    },
  });
  api.init();
  debug(modulename + ': openApi initialised');
};

/* middleware functions below */

/**
 * This tests if the connection to the user members database collection has been created and, if not, creates it.  This results in a members Mongoose model being created for the requesting user and stored in appLocals.models. Once the model exists it does not have to be recreated if that user makes another request.
 * @params req - the incoming API request.
 * @params next - next function.
 */

const createDbCollectionConnection = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running createCollectionConnection');

  /* check that the database is connected */
  const { dbConnection } = req.app.appLocals;
  if (
    !dbConnection ||
    dbConnection.readyState !== Perform.DbReadyState.Connected
  ) {
    req.app.appLocals.logger.error(modulename + ': Database not connected');
    const errDb: Perform.IErr = {
      name: 'DATABASE_ACCESS',
      message: 'The database service is unavailable',
      statusCode: 503,
      dumped: false,
    };
    next(errDb);
  }

  /* connect to database collection only if the stored model does not already match the user */
  const appLocals = req.app.appLocals;
  if (
    !(
      appLocals.models.members &&
      appLocals.models.members.modelName &&
      appLocals.models.members.modelName.substring(
        0,
        req.user!.dbCollection.length,
      ) === `${req.user!.dbCollection}`
    )
  ) {
    debug(modulename + ': creating connection to user database collection');
    appLocals.models.members = appLocals.createModelMembers(
      appLocals.database,
      `${req.user!.dbCollection}_Member`,
      `${req.user!.dbCollection}_members`,
    );
  }
  next();
};

/**
 * Gets the user (or throws an error) and, if not already created, creates the connection to the user collection on the database.
 */
const findUser = (req: Request, res: Response, next: NextFunction) => {
  debug(modulename + ': running findUser');

  let user: Perform.User | undefined;

  if (req.auth) {
    user = req.app.appLocals.getUser(req.auth.sub);
  } else {
    const error = new Error();
    error.name = 'NoAuthentication';
    error.message = 'Unknown authentication error - no req.auth created';
    res.statusCode = 401;
    next(error);
  }

  if (user) {
    req.user = user;
  } else {
    const error = new Error();
    error.name = 'NoUser';
    error.message = 'No user matching authentication token was found';
    res.statusCode = 401;
    next(error);
  }

  next();
};

/**
 * Calls the api handler function based on the url path.
 */
const callApiHandler = (req: Request, res: Response, next: NextFunction) => {
  debug(modulename + ': running callApiHandler');

  /* initialise OpenApi if not already done */
  if (!api) {
    debug(modulename + ': initialising OpenApi');
    initOpenApi(req.app.appLocals);
  }

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
  );
};

export const checkError = (
  error: any,
  req: any,
  _res: Response,
  next: NextFunction,
) => {
  req.app.appLocals.logger.error(modulename + ': Authorization fail');
  /* apply code 401 meaning there was a problem with credentials */
  error.statusCode = 401;
  error.dumped = false;
  next(error);
};

const authenticate = Router();
authenticate.use(
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.handlers.authenticateHandler(req, res, next);
  },
  /* catch authentication errors */
  checkError,
);

const authorize = Router();
authorize.use(
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.handlers.authorizeHandler(req, res, next);
  },
  /* catch authorization errors */
  checkError,
);

router.use(
  '/',
  authenticate,
  authorize,
  /* get the user */
  findUser,
  /* create connection to the user database model / collection */
  createDbCollectionConnection,
  /* call a handler based on the path and the api spec */
  callApiHandler,
);

export { router as apiController };
