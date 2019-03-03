'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debugFunction = require('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/**
 * All test modules that need a server use index.js or monitor.js to
 * start the server (parhaps on each 'it' function) and then close it
 * before they exit.
 */

before('Before all tests', async () => {
});

after('After all tests', async () => {
});
