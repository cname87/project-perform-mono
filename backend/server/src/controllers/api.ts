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
import ms from 'ms';
import jwt = require('express-jwt');
import util = require('util');

import { IRequestApp, IAppLocals } from '../configServer';
import { IErr } from '../../../utils/src/configUtils';
import { getUser } from '../../../users/users';
import jwksRsa = require('jwks-rsa');

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

        /* let angular or errorhandler deal with not founds */
        nextFunction();
      },
    },
  });
  api.init();
};

/* middleware functions below */

/**
 * Verifies the jwt token.
 * Sets req.auth to the token payload.
 * Note: req.auth.sub will be set to the Auth0 user id.
 */
const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  debug(modulename + ': running checkJwt');

  /* retrieves the rsa signing key */
  const secret = jwksRsa.expressJwtSecret({
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: ms('10h'),
    /* prevent attackers from sending many random */
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_CONFIG_DOMAIN}/.well-known/jwks.json`,
  });

  const checkToken = jwt({
    secret,
    audience: process.env.AUTH0_CONFIG_AUDIENCE,
    issuer: `https://${process.env.AUTH0_CONFIG_DOMAIN}/`,
    algorithm: ['RS256'],
    requestProperty: 'auth',
  });

  /* run the created middleware */
  checkToken(req, res, next);
};

/**
 * Gets the user (or throws an error) and creates the connection to the user collection on the server database.
 */
const createDbModel = (_req: Request, _res: Response, next: NextFunction) => {
  debug(modulename + ': running find user and create model middleware');

  /* retype _req to match actual incoming request */
  const req = _req as IRequestApp;
  const appLocals = req.app.appLocals;

  /* get the user based on the authentication token */
  if (req.auth) {
    const user = getUser(req.auth.sub);
    if (!user) {
      next('NoUserError');
    } else {
      /* test if the connection to the user members database collection has been created and, if not, create it */
      if (
        !(
          appLocals.models.members &&
          appLocals.models.members.modelName.substring(0, user.email.length) ===
            `${user.email}`
        )
      ) {
        appLocals.models.members = appLocals.config.createModelMembers(
          appLocals.database,
          `${user.email}_Member`,
          `${user.email}_members`,
        );
      }
    }
  } else {
    next('UnknownError');
  }
  next();
};

const handleErrors = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running handleErrors');

  if (err.name === 'NoUserError') {
    res.statusCode = 401;
    err.message = 'No user matching authentication token was found';
    next(err);
  } else {
    next(err);
  }
};

/**
 * Calls the api handler function based on the url path.
 */
const callApiHandler = (_req: Request, res: Response, next: NextFunction) => {
  debug(modulename + ': running callApiHandler');

  /* retype _req to match actual incoming request */
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

router.use(
  /* verify the jwt token and set req.auth */
  checkJwt,
  /* create connection to database model / collection */
  createDbModel,
  /* handle authentication and user errors */
  handleErrors,
  /* call a handler based on the path and the api spec */
  callApiHandler,
);

export { router as apiController };
