/**
 * This module provides a utility executable to allow a launch configuration to test whether the server is running and, if not, then start it and wait until it is running before proceeding.
 *
 * See pingServer for the implementation.
 *
 * Usage:
 * Set up a vscode task that runs this file as the argument to node.exe.
 * Set the task as a preLaunchTask in a launch configuration.
 *
 */

import { spawn } from 'child_process';
import { pingServer } from './pingServer';

/* need the path to the .js server index file */
const indexJsPath = 'backend/dist/src/index';

/**
 * Ping the server and, if the ping fails, then start the server.
 *
 * @returns 1 if a connection is made to a server; 0 if the connection failed.
 *
 * */

async function test() {
  try {
    await pingServer(1);
    console.log('Connected to a previously-running server');
    return 0;
  } catch (err) {
    /* await pingServer() will throw an error if the connection fails */
    console.log('Trying to start the server');
    /* start the server in a detached subprocess */
    const child = spawn('node', ['--', indexJsPath], {
      detached: true,
      stdio: 'inherit',
    });
    child.unref();
  }
  try {
    console.log('Starting to ping the server');
    await pingServer();
    console.log('Connected to the newly-started server');
    return 0;
  } catch (err) {
    console.log('Failed to start the server');
    return 1;
  }
}

test();
