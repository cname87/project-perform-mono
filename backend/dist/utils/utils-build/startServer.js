"use strict";
/**
 * This module provides a utility executable to allow a launch configuration to test is the server running and if not then start it and wait until it is running before proceeding.
 *
 * See pingServer for the implementation.
 *
 * * Usage:
 * Set up a vscode task that runs this file as the argument to node.exe.
 * Set the task as a preLaunchTask in a launch configuration.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
const pingServer_1 = require("./pingServer");
/* try connect to server until it's up and then return and exit */
async function test() {
    try {
        await pingServer_1.pingServer(1);
        console.log('Connected to previously-running server');
        return 0;
    }
    catch (err) {
        console.log('Trying to start server');
        /* start the server */
        Promise.resolve().then(() => tslib_1.__importStar(require('../../index')));
    }
    try {
        console.log('starting ping');
        await pingServer_1.pingServer();
        console.log('Connected to newly-started server');
        return 0;
    }
    catch (err) {
        console.log('Failed to start server');
        return 1;
    }
}
test();
//# sourceMappingURL=startServer.js.map