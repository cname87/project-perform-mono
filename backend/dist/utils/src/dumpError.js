"use strict";
/**
 * This module provides a error logging service.
 * It uses the winston logger utility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
// type DumpError {
//   (err: any) => void;
// }
class DumpError {
    /* instantiates if necessary and sets dump to logger.error or console.error */
    constructor(initialLogger) {
        if (!DumpError.instance) {
            DumpError.dump = initialLogger
                ? initialLogger.error.bind(initialLogger)
                : console.error;
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
        if (err.name) {
            DumpError.dump('Error Name: \n' + err.name + '\n');
        }
        if (err.message) {
            DumpError.dump('Error Message: \n' + err.message + '\n');
        }
        else {
            /* if no message property just dump the object */
            DumpError.dump(err.toString());
        }
        if (err.statusCode) {
            DumpError.dump('Error HTTP Status Code: \n' + err.statusCode + '\n');
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
//# sourceMappingURL=dumpError.js.map