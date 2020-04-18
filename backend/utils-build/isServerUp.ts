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

import { pingServer } from './pingServer';

/* try connect to server (for a number of pings) and then return and exit */
pingServer(10)
  .then(() => {
    console.log('Connected to server');
  })
  .catch((err) => {
    console.error(err.message);
  });
