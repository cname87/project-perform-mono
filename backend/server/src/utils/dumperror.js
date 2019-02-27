'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * This module provides a error logging service.
 * It uses the winston logger utility.
 */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
class DumpError {
    static getInstance(initialLogger) {
        if (!DumpError.instance && initialLogger) {
            DumpError.instance = new DumpError(initialLogger);
        }
        return DumpError.instance;
    }
    constructor(initialLogger) {
        if (!DumpError.instance && initialLogger) {
            DumpError.dump = initialLogger.error;
            DumpError.instance = dumpError;
        }
        return DumpError.instance;
    }
}
exports.DumpError = DumpError;
function dumpError(err) {
    debug(modulename + ': running dumpError');
    if (err && typeof err === 'object') {
        if (err.dumped) {
            debug(modulename + ': error already dumped');
            return;
        }
        if (err.message) {
            DumpError.dump('Error Message: \n' + err.message + '\n');
        }
        else {
            /* if no message property just dump the object */
            DumpError.dump(err);
        }
        if (err.status) {
            DumpError.dump('Error Status: \n' + err.status + '\n');
        }
        if (err.code) {
            DumpError.dump('Error Code: \n' + err.code + '\n');
        }
        if (err.stack) {
            DumpError.dump('Error Stacktrace: \n' + err.stack + '\n');
        }
        /* mark so not dumped twice */
        err.dumped = true;
    }
    else if (typeof err === 'string') {
        DumpError.dump('Error String: ' + err);
    }
    else {
        DumpError.dump('DumpError: err is null or not an object or string');
    }
}
//# sourceMappingURL=dumperror.js.map