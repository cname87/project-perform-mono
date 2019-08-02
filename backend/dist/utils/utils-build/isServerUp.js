"use strict";
/**
 * This module provides a utility executable to allow a launch configuration test that the server is up before proceeding.
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
pingServer_1.pingServer()
    .then(() => {
    console.log('Connected to server');
    return;
})
    .catch((err) => {
    console.error(err.message);
    return;
});
//# sourceMappingURL=isServerUp.js.map