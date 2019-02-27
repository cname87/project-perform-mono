'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
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
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* external dependencies */
const body_parser_1 = tslib_1.__importDefault(require("body-parser"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const cookie_parser_1 = tslib_1.__importDefault(require("cookie-parser"));
const express_1 = tslib_1.__importDefault(require("express"));
// import favicon from 'serve-favicon';
const url_1 = tslib_1.__importDefault(require("url"));
const util_1 = tslib_1.__importDefault(require("util"));
const v1_1 = tslib_1.__importDefault(require("uuid/v1"));
/**
 * Sets up express middleware and responds to incoming requests.
 * @param app
 * The express app object
 * app.locals holds other set up objects including the array used to store
 * the https(s) servers.
 * @returns
 * Void.
 */
async function runServer(app) {
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
    app.use(compression_1.default());
    /* assign a unique id to each request */
    function assignId(req, _res, next) {
        req.id = v1_1.default();
        next();
    }
    app.use(assignId);
    /* serve favicon file (before logger) */
    // app.use(favicon(config.FAVICON));
    /* log simple format to default stdout */
    app.use(serverLogger.logConsole);
    /* log detailed format to file */
    app.use(serverLogger.logFile);
    /* parse the body for 4 type options */
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({
        extended: false,
    }));
    app.use(body_parser_1.default.text());
    app.use(body_parser_1.default.raw());
    /* parse cookies to req.cookies / req.signedCookies */
    app.use(cookie_parser_1.default(config.COOKIE_KEY));
    if (app.get('env') === 'development') {
        /* debug log basic information from the request */
        app.use(function debugRequest(req, _res, next) {
            debug('\n' + modulename + ': *** Request received ***\n');
            debug(modulename + ': req.url: ' + req.url);
            debug(modulename + ': re.baseUrl: ' + req.baseUrl);
            debug(modulename + ': req.originalUrl: ' + req.originalUrl);
            debug(modulename + ': req.method: ' + req.method);
            debug(modulename +
                ': url query string: ' +
                url_1.default.parse(req.originalUrl).search);
            debug(modulename + ': body query string: ' + util_1.default.inspect(req.query));
            debug(modulename + 'body: ' + util_1.default.inspect(req.body));
            debug(modulename + ': signed cookies: ' + util_1.default.inspect(req.signedCookies));
            next();
        });
    }
    /* enable test functionality in dev mode or if set by a test */
    if (app.get('env') === 'development' || app.get('test')) {
        /* serve server test files from a static server mounted on /testServer */
        const staticTestOptions = {
            redirect: false,
        };
        app.use('/testServer', express_1.default.static(config.STATIC_TEST_PATH, staticTestOptions));
        /* use fail controller to test errorhandling */
        app.use('/testServer/fail', (req, res, next) => {
            debug(modulename + ': calling .../fail controller');
            controllers.fail(req, res, next);
        });
        /* respond to posted raiseEvents from test pages */
        app.post('/raiseEvent', handles['raiseEvent']);
    }
    /* serve the angular files */
    const staticAppOptions = {
        maxAge: '1d',
        redirect: false,
    };
    app.use(express_1.default.static(config.APP_PATH, staticAppOptions));
    /* present the angular index.html page for anything not routed by angular */
    app.use('/', 
    /* skip dummyurl for server test purposes */
    (req, res, next) => {
        if (req.path.slice(0, 9) !== '/dummyurl') {
            controllers.root(req, res, next);
        }
        else {
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
exports.runServer = runServer;
//# sourceMappingURL=runServer.js.map