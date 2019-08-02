"use strict";
/**
 * This module supplies handler functions used across different
 * controllers.
 * It exports a handles object containing all handles.
 * The handles object is injected downstream from index.js.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
const util = require("util");
/**
 * This handler emits an even.
 * The event emitter is req.app.appLocals.event.
 * The event emitted is 'handlersRaiseEvent'.
 * The argument passed is a object with 2 properties:
 * number and message.  The values are read from the
 * request body, i.e. sent in via a POST.
 * A response is sent with a status of 200.
 * Note: There is no checking of the request body data..
 */
function raiseEvent(req, res) {
    debug(modulename + ': handler raiseEvent was called');
    /* retrieve data sent via POST */
    /* default to 0 and '' */
    let message = '';
    if (req.body.message) {
        message = req.body.message;
    }
    let numberToSend = '';
    if (req.body.number) {
        numberToSend = req.body.number;
    }
    const arg = {
        message,
        number: numberToSend,
    };
    /* raise an event */
    const event = req.app.appLocals.event;
    event.emit('handlersRaiseEvent', arg);
    res.status(200);
    res.end();
}
/**
 * This examines a supplied payload and result code against a supplied openapi-backend context object and returns an openapi-backend ValidationResult.
 */
const isResponseValid = (context, payload, statusCode) => {
    debug(modulename + ': running postResponseHandler');
    if (!(context && context.operation && context.operation.responses)) {
        /* return invalid */
        return {
            valid: false,
            errors: [
                {
                    keyword: 'unexpected',
                    dataPath: '',
                    schemaPath: '',
                    params: [],
                    message: 'context or operation missing in response validation call',
                },
            ],
        };
    }
    /* manual validation required if body is empty */
    if (!payload) {
        debug(modulename + ': empty body reported');
        /* match content for status code and return valid if no content -  otherwise proceed */
        const responseObject = context.operation.responses[statusCode];
        if (!responseObject.content) {
            return {
                valid: true,
                errors: null,
            };
        }
    }
    return context.api.validateResponse(payload, context.operation, statusCode);
};
/**
 * This handler sends a JSON payload in a response.
 */
const writeJson = (context, req, res, next, code, payload) => {
    debug(modulename + ': running writeJson');
    const validationResult = isResponseValid(context, payload, code);
    if (!validationResult.valid) {
        // response validation failed
        const err = {
            name: 'RESPONSE_VALIDATION_FAIL',
            message: 'Response validation fail error:\n' +
                util.inspect(validationResult.errors) +
                '\nResponse payload:\n' +
                util.inspect(payload),
            statusCode: 502,
            dumped: false,
        };
        req.app.appLocals.dumpError(err);
        err.message = 'Response validation fail';
        next(err);
    }
    else {
        /* no error */
        res.status(code).json(payload);
    }
};
/* export the list of available request handlers */
exports.miscHandlers = {
    raiseEvent,
    writeJson,
};
//# sourceMappingURL=miscHandlers.js.map