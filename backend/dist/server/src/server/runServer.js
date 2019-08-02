"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* external dependencies */
const bodyParser = require("body-parser");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const express = require("express");
const path = require("path");
const urlParser = require("url");
const util = require("util");
const uuidv1 = require("uuid/v1");
/**
 * Sets up express middleware and responds to incoming requests.
 * @param app
 * The express app object
 * TODO - complete doc.
 * @returns Void.
 */
async function runServer(app, config, controllers, errorHandlers, handles, serverLogger) {
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
    function assignId(req, _res, next) {
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
    app.use(express.urlencoded({
        extended: false,
    }));
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
            debug(modulename +
                ': url query string: ' +
                urlParser.parse(req.originalUrl).search);
            debug(modulename + ': body query string: ' + util.inspect(req.query));
            debug(modulename + 'body: ' + util.inspect(req.body));
            debug(modulename + ': signed cookies: ' + util.inspect(req.signedCookies));
            next();
        });
    }
    /* enable test functionality in dev mode */
    if (app.get('env') === 'development') {
        /* serve server test files from a static server mounted on /testServer */
        const staticTestOptions = {
            redirect: false,
        };
        app.use('/testServer', express.static(config.STATIC_TEST_PATH, staticTestOptions));
        /* serve node_modules files from a static server mounted on /node_modules so mocha etc can be loaded by the browser for client-fired tests */
        app.use('/node_modules', express.static(config.NODE_MODULES_PATH, staticTestOptions));
        /* respond to request whether test database is in use */
        app.use('/testServer/isTestDatabase', (_req, res, _next) => {
            debug(modulename + ': calling isTestDatabase');
            const result = {
                isTestDatabase: app.appLocals.database.dbConnection.db.databaseName ===
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
    /* handle openapi-backend calls a handler based on the path and the api */
    app.use(
    /* use for api paths only */
    process.env.API_BASE_PATH, (req, res, next) => {
        debug(modulename + ': calling the api controller');
        controllers.api(req, res, next);
    });
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
        }
        else {
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
exports.runServer = runServer;
//# sourceMappingURL=runServer.js.map