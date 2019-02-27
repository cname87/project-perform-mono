"use strict";
/**
 * This module handles requests for .../fail.
 * It is to test server fail scenarios.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/* dependencies */
const express_1 = tslib_1.__importDefault(require("express"));
exports.router = express_1.default.Router();
const express_async_handler_1 = tslib_1.__importDefault(require("express-async-handler"));
const http_errors_1 = tslib_1.__importDefault(require("http-errors"));
const mongodb_1 = require("mongodb");
/**
 * Tests various error scenarios: If the url query matches...
 * - 'fail=coffee' then it returns the 'coffee' error code (418)
 * i.e. this tests setting an error status code.
 * - 'sent' then it sends a response and calls next() - no further
 * response should be sent by the error handler.
 * - 'fail=error' then it throws an error.
 * - 'fail=crash' then it shuts the process.
 *
 * @throws see above.
 *
 */
exports.router.get('/', (req, res, next) => {
    debug(modulename + ': running an error scenario');
    /* Throws an unhandled promise rejection - tested below */
    async function asyncFail(_req, _res, _next) {
        debug(modulename + ': throwing an unhandled rejection');
        await Promise.reject(http_errors_1.default(501, 'Testing trapped ' + 'unhandled promise rejection'));
    }
    /* set true to enable server test paths */
    req.app.set('test', true);
    /* read url query */
    switch (req.query.fail) {
        case '404-prod':
            debug(modulename + ": creating 404 error - 'production' mode");
            /* testing 'production' mode' */
            req.app.set('env', 'production');
            return next(http_errors_1.default(404, 'Test: Page not found!'));
        case '404-dev':
            debug(modulename + ": creating 404 error - 'development' mode");
            /* testing 'development' mode' */
            req.app.set('env', 'development');
            return next(http_errors_1.default(404, 'Test: Page not found!'));
        case 'coffee':
            debug(modulename + ': coffee requested - sending a 418 code');
            req.app.set('env', 'production');
            return next(http_errors_1.default(418, "Test: I'm a teapot!"));
        case 'sent':
            debug(modulename + ': testing sending a response and calling next()');
            req.app.set('env', 'production');
            res.status(200);
            res.send('Test: Response sent');
            /* call next(err) even though response sent */
            return next(http_errors_1.default(503, 'Test: next(503) after headers sent'));
        case 'trap-503':
            debug(modulename + ': testing trapping an error and assigning an error code');
            req.app.set('env', 'production');
            throw new mongodb_1.MongoError(modulename + ': Test error');
        case 'async-handled':
            debug(modulename + ': testing a trapped promise rejection');
            req.app.set('env', 'production');
            return express_async_handler_1.default(asyncFail)(req, res, next);
        case 'error':
            /* test throwing an error, with nothing sent */
            debug(modulename + ': throwing a test error');
            req.app.set('env', 'production');
            throw new Error(modulename + ': Test error');
        case 'async':
            /* test an unhandled rejection - will trigger a shutdown*/
            debug(modulename + ': generating an unhandled rejection');
            req.app.set('env', 'production');
            /* test sending a response before error */
            res.status(200);
            res.send('Test: ' + 'Server shutting down due to unhandled promise rejection');
            return Promise.reject(new Error(modulename + ': Test unhandled promise rejection'));
        case 'renderError':
            debug(modulename + ': testing a view render error');
            req.app.set('env', 'production');
            /* stub res.render to create a callback error */
            const stub = (_view, _options, cb) => {
                const err = new Error(modulename + ': Test error');
                const html = '';
                if (cb) {
                    cb(err, html);
                }
            };
            res.render = stub;
            /* throw an error to call the errorhandling */
            throw new Error(modulename + ': Test error');
        case 'crash':
            debug(modulename + ': forcing server process exit(-1)');
            req.app.set('env', 'production');
            res.status(200);
            res.send('Test: ' + 'Server shutting down due to process.exit');
            return process.exit(-1);
        default:
            debug(modulename + ': /fail query not sent or not recognised');
            return next(http_errors_1.default(404, '/fail query not sent or not recognised'));
    }
});
//# sourceMappingURL=fail.js.map