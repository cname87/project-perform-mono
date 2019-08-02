"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* import configuration parameters into process.env */
/* the .env file must be in process.cwd() */
const dotenv = require("dotenv");
dotenv.config();
/* set DB_MODE to 'test' to load the test database */
process.env.DB_MODE = 'test';
/* file header */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/* external dependencies */
require("mocha");
/*
 * Note: All test modules that need a server use index.js or monitor.js to
 * start the server (parhaps on each 'it' function) and then close it
 * before they exit.
 */
before('Before all tests', async () => { });
after('After all tests', async () => { });
//# sourceMappingURL=testSetup.js.map