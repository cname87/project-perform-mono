/**
 * This module provides a utility executable to allow a launch configuration to test is the server running and, if not, then start it and wait until it is running before proceeding.
 *
 * See pingServer for the implementation.
 *
 * Usage:
 * Set up a vscode task that runs this file as the argument to node.exe.
 * Set the task as a preLaunchTask in a launch configuration.
 *
 */

import { pingServer } from './pingServer';

/* try connect to server until it's up and then return and exit */
async function test() {
  try {
    await pingServer(1);
    console.log('Connected to previously-running server');
    return 0;
  } catch (err) {
    console.log('Trying to start server');
    /* start the server */
    import('../src/index');
  }
  try {
    console.log('starting ping');
    await pingServer();
    console.log('Connected to newly-started server');
    return 0;
  } catch (err) {
    console.log('Failed to start server');
    return 1;
  }
}

test();
