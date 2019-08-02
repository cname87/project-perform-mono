"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* import configuration parameters into process.env */
/* the .env file must be in process.cwd() */
const dotenv = require("dotenv");
dotenv.config();
/* file header */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
exports.debug = debug_1.default(`PP_${modulename}`);
exports.debug(`Starting ${modulename}`);
/* external dependencies */
// import minimist = require('minimist');
/* run the server */
Promise.resolve().then(() => tslib_1.__importStar(require('./server/src/index')));
/* capture command line arguments */
// const argv = minimist(process.argv.slice(2));
//# sourceMappingURL=index.js.map