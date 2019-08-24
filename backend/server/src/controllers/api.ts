/**
 * This module handles requests for .../api-v1/.
 * It is to serve all api requests.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import { Router, Request, NextFunction, Response } from 'express';
import OpenAPIBackend from 'openapi-backend';
import util = require('util');

import { IRequestApp, IAppLocals } from '../configServer';
import { IErr } from '../../../utils/src/configUtils';
import { getUser } from '../../../users/users';
import { User } from '../../../users/configUsers';

const router = Router();

/* initialize Openapi-backend middleware - run once only for performance */
let api: OpenAPIBackend;
const initOpenApi = (appLocals: IAppLocals) => {
  /* route paths as per the api file */
  api = new OpenAPIBackend({
    definition: appLocals.config.API_FILE,
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
        request: IRequestApp,
        response: Response,
        nextFunction: NextFunction,
      ) => {
        const result = {
          isTestDatabase:
            appLocals.database.dbConnection.db.databaseName ===
            process.env.DB_DATABASE_TEST,
        };
        appLocals.miscHandlers.writeJson(
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
        request: IRequestApp,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.membersApi.getMember(
          context,
          request,
          response,
          nextFunction,
        ),
      getMembers: (
        context,
        request: IRequestApp,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.membersApi.getMembers(
          context,
          request,
          response,
          nextFunction,
        ),
      addMember: (
        context,
        request: IRequestApp,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.membersApi.addMember(
          context,
          request,
          response,
          nextFunction,
        ),
      deleteMember: (
        context,
        request: IRequestApp,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.membersApi.deleteMember(
          context,
          request,
          response,
          nextFunction,
        ),
      deleteMembers: (
        context,
        request: IRequestApp,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.membersApi.deleteMembers(
          context,
          request,
          response,
          nextFunction,
        ),
      updateMember: (
        context,
        request: IRequestApp,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.membersApi.updateMember(
          context,
          request,
          response,
          nextFunction,
        ),
      validationFail: (
        context,
        _request: IRequestApp,
        _response: Response,
        nextFunction: NextFunction,
      ) => {
        debug(modulename + ': running validationFail');

        appLocals.logger.error(modulename + ': API validation fail');
        const err: IErr = {
          name: 'REQUEST_VALIDATION_FAIL',
          message: 'API validation fail',
          statusCode: 400,
          dumped: false,
        };

        if (!(context && context.validation && context.validation.errors)) {
          /* openapi-backend types require this test */
          /* unexpected error if context.validation.errors returned */
          err.message = err.message + ': unexpected failure';
          err.statusCode = 500;
          return nextFunction(err);
        }

        /* dump detail and then strip back for the client */
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
};

/* middleware functions below */

/**
 * This tests if the connection to the user members database collection has been created and, if not, creates it.
 * @params req - the incoming API request.
 * @params user - the user identified in the request.
 */

const createDbConnection = (req: IRequestApp, user: User) => {
  debug(modulename + ': running create DbConnection');

  const appLocals = req.app.appLocals;
  if (
    !(
      appLocals.models.members.modelName &&
      appLocals.models.members.modelName.substring(
        0,
        user._dbCollection.length,
      ) === `${user._dbCollection}`
    )
  ) {
    appLocals.models.members = appLocals.config.createModelMembers(
      appLocals.database,
      `${user._dbCollection}_Member`,
      `${user._dbCollection}_members`,
    );
  }
};

/**
 * Gets the user (or throws an error) and creates the connection to the user collection on the server database.
 */
const createDbModel = (_req: Request, res: Response, next: NextFunction) => {
  debug(modulename + ': running find user and create model middleware');

  /* retype _req to match actual incoming request */
  const req = _req as IRequestApp;

  let user: User | null = null;

  if (req.auth) {
    user = getUser(req.auth.sub);
  } else {
    const error = new Error();
    error.name = 'NoAuthentication';
    error.message = 'Unknown authentication error - no req.auth created';
    res.statusCode = 401;
    next(error);
  }

  if (user) {
    createDbConnection(req, user!);
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
const callApiHandler = (_req: Request, res: Response, next: NextFunction) => {
  debug(modulename + ': running callApiHandler');

  /* retype _req to match actual incoming request that has req.app */
  const req = _req as IRequestApp;

  /* initialise OpenApi if not already done */
  if (!api) {
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
  error.statusCode = 403;
  error.dumped = false;
  next(error);
};

const authorize = Router();
authorize.use(
  (_req: Request, res: Response, next: NextFunction) => {
    /* retype _req to match actual incoming request that has req.app */
    const req = _req as IRequestApp;
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.authorizeHandler(req, res, next);
  },
  /* catch authorization errors */
  checkError,
);

router.use(
  '/',
  (_req: Request, res: Response, next: NextFunction) => {
    /* retype _req to match actual incoming request that has req.app */
    const req = _req as IRequestApp;
    /* verify the jwt token and set req.auth */
    req.app.appLocals.authenticateHandler(req, res, next);
  },
  authorize,
  /* create connection to the user database model / collection */
  createDbModel,
  /* call a handler based on the path and the api spec */
  callApiHandler,
);

export { router as apiController };
