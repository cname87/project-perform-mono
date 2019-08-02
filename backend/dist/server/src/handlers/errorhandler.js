"use strict";
/**
 * This module handles errors, i.e. errors passed via the Express
 * error-handling mechanism.  It also handles requests that pass
 * through without a route being identified.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
exports.debug = debug_1.default('PP_' + modulename); // exported for mocha
exports.debug(`Starting ${modulename}`);
const createError = require("http-errors");
const urlParser = require("url");
const util = require("util");
/* module variables */
let logger;
/**
 * Catches any request that passes through all middleware
 * to this point without error and creates a 'Not Found' error.
 */
function notFound(_req, _res, next) {
    exports.debug(modulename + ': notFound called');
    next(createError(404));
}
/**
 * Catches all errors.
 * Asssigns a HTTP error code to res.statusCode.
 * A code is assigned to communicate a message to the client.
 * Note: Errors left with code 500 (Internal Server Error) trigger a uncaught
 * exception in the final errorhandling function.
 */
function assignCode(err, _req, res, next) {
    exports.debug(modulename + ': assignCode called');
    if (typeof err === 'object') {
        /* set the response status code to the error statusCode field, if one was added on error creation, or if one was added above. */
        res.statusCode = err.statusCode ? err.statusCode : res.statusCode;
        /* if empty, set the response code to internal server error, 500. */
        res.statusCode = res.statusCode ? res.statusCode : 500;
        /* if 20x, set the response code to internal server error, 500. */
        res.statusCode =
            res.statusCode < 200 || res.statusCode > 299 ? res.statusCode : 500;
    }
    next(err);
}
/**
 * Log detail on all errors passed in.
 */
function logError(err, req, res, next) {
    exports.debug(modulename + ': logError started');
    logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    logger.error(modulename + ': server logger called');
    logger.error(modulename +
        ': http request detail:' +
        '\nreq.url: ' +
        req.url +
        '\nreq.ip: ' +
        req.ip +
        '\nreq.method: ' +
        req.method +
        '\nurl query string: ' +
        urlParser.parse(req.originalUrl).search +
        '\nbody query string: ' +
        util.inspect(req.query) +
        '\nsigned cookies: ' +
        util.inspect(req.signedCookies) +
        '\nResponse http status code: ' +
        res.statusCode);
    /* dump the error */
    dumpError(err);
    next(err);
}
/**
 * Sends a response to the client with status code and message.
 */
function sendErrorResponse(err, _req, res, next) {
    /* set response */
    const message = {
        code: res.statusCode,
        message: err.message,
    };
    /* check that response not already sent */
    /* Note: swagger response validation fail will have set headers */
    if (!res.headersSent) {
        /* send the error response */
        res.status(res.statusCode).json(message);
    }
    else {
        /* send nothing if headers already sent */
        exports.debug(modulename + ': not sending a client response as headers already sent');
        /* override 404 res.statusCode as 404 will be returned if a next
         * is called in error after headers have been sent */
        res.statusCode = res.statusCode === 404 ? 500 : res.statusCode;
    }
    /* pass on so does not hang */
    next(err);
}
/**
 * Emits an uncaught exception (which stops the server) if the error code
 * is 500.  That is, if I have assigned anything other than 500, I understand
 * the error and do not need to close the error.  If I assign the code 500 I
 * am telling the client we had an unexpected server error and I then stop
 * the server (which should restart).
 */
function throwError(err, _req, res, next) {
    exports.debug(modulename + ': throwError called');
    if (res.statusCode === 500) {
        /* reset the server after a delay to allow error data be sent */
        setTimeout(() => {
            /* caught in index.js */
            process.emit('thrownException', err);
        }, 1000);
    }
    next();
}
/* export object with all error handling functions */
exports.errorHandlers = {
    notFound,
    assignCode,
    logError,
    sendErrorResponse,
    throwError,
};
//# sourceMappingURL=errorhandler.js.map