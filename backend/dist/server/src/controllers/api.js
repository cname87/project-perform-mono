"use strict";
/**
 * This module handles requests for .../api-v1/.
 * It is to serve all api requests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/* external dependencies */
const express_1 = require("express");
const openapi_backend_1 = tslib_1.__importDefault(require("openapi-backend"));
const ms_1 = tslib_1.__importDefault(require("ms"));
const jwt = require("express-jwt");
const util = require("util");
const users_1 = require("../../../users/users");
const jwksRsa = require("jwks-rsa");
const router = express_1.Router();
exports.apiController = router;
/* initialize Openapi-backend middleware - run once only for performance */
let api;
const initOpenApi = (appLocals) => {
    /* route paths as per the api file */
    api = new openapi_backend_1.default({
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
            getIsTestDatabase: (context, request, response, nextFunction) => {
                const result = {
                    isTestDatabase: appLocals.database.dbConnection.db.databaseName ===
                        process.env.DB_DATABASE_TEST,
                };
                appLocals.miscHandlers.writeJson(context, request, response, nextFunction, 200, result);
            },
            getMember: (context, request, response, nextFunction) => appLocals.membersApi.getMember(context, request, response, nextFunction),
            getMembers: (context, request, response, nextFunction) => appLocals.membersApi.getMembers(context, request, response, nextFunction),
            addMember: (context, request, response, nextFunction) => appLocals.membersApi.addMember(context, request, response, nextFunction),
            deleteMember: (context, request, response, nextFunction) => appLocals.membersApi.deleteMember(context, request, response, nextFunction),
            deleteMembers: (context, request, response, nextFunction) => appLocals.membersApi.deleteMembers(context, request, response, nextFunction),
            updateMember: (context, request, response, nextFunction) => appLocals.membersApi.updateMember(context, request, response, nextFunction),
            validationFail: (context, _request, _response, nextFunction) => {
                debug(modulename + ': running validationFail');
                appLocals.logger.error(modulename + ': API validation fail');
                const err = {
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
            _context, _request, _response, nextFunction) => {
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
const checkJwt = (req, res, next) => {
    debug(modulename + ': running checkJwt');
    /* retrieves the rsa signing key */
    const secret = jwksRsa.expressJwtSecret({
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: ms_1.default('10h'),
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
const createDbModel = (_req, _res, next) => {
    debug(modulename + ': running find user and create model middleware');
    /* retype _req to match actual incoming request */
    const req = _req;
    const appLocals = req.app.appLocals;
    /* get the user based on the authentication token */
    if (req.auth) {
        const user = users_1.getUser(req.auth.sub);
        if (!user) {
            next('NoUserError');
        }
        else {
            /* test if the connection to the user members database collection has been created and, if not, create it */
            if (!(appLocals.models.members &&
                appLocals.models.members.modelName.substring(0, user.email.length) ===
                    `${user.email}`)) {
                appLocals.models.members = appLocals.config.createModelMembers(appLocals.database, `${user.email}_Member`, `${user.email}_members`);
            }
        }
    }
    else {
        next('UnknownError');
    }
    next();
};
const handleErrors = (err, _req, res, next) => {
    debug(modulename + ': running handleErrors');
    if (err.name === 'NoUserError') {
        res.statusCode = 401;
        err.message = 'No user matching authentication token was found';
        next(err);
    }
    else {
        next(err);
    }
};
/**
 * Calls the api handler function based on the url path.
 */
const callApiHandler = (_req, res, next) => {
    debug(modulename + ': running callApiHandler');
    /* retype _req to match actual incoming request */
    const req = _req;
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
        headers: req.headers,
    }, req, res, next);
};
router.use(
/* verify the jwt token and set req.auth */
checkJwt, 
/* create connection to database model / collection */
createDbModel, 
/* handle authentication and user errors */
handleErrors, 
/* call a handler based on the path and the api spec */
callApiHandler);
//# sourceMappingURL=api.js.map