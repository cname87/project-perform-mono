/**
 * This module provides a utility executable to allow a launch configuration test that the server is up before proceeding.
 *
 * See pingServer for the implementation.
 *
 * Usage:
 * Set up a vscode task that runs this file as the argument to node.exe.
 * Set the task as a preLaunchTask in a launch configuration.
 *
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import { pingServer } from './pingServer';

/* try connect to server until it's up and then return and exit */
pingServer()
  .then(() => {
    console.log('Connected to server');
    return;
  })
  .catch((err) => {
    console.error(err.message);
    return;
  });
