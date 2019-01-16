'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debugFunction = require('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/**
 * Starts the database in advance of all tests.
 * It also closes it afterwards if this functionality is
 * not commented out.
 *
 * All describe functions should leave the database
 * open so all other describe functions can assume an open database.
 * (Specific database tests close and reopen the database).
 *
 * All describe functions close all database connections or servers
 * that they create before they exit so mocha exits on test completion.
 *
 * All test modules that need a server use index.js or monitor.js to
 * start the server (parhaps on each 'it' function) and then close it
 * before they exit.
 */

const { config } = require('../dist/.config');

before('Set up database', async () => {
  /* start the database before all tests */
  await config.EXT_DB_SERVICE.startDB(config);
});

after('Shut down the database', async () => {
  /* shutdown the database after all tests */
  // Comment in or out as required
  // await config.EXT_DB_SERVICE.shutdownDB(config);
});
