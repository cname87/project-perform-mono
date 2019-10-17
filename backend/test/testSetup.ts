/* import configuration parameters into process.env */
import '../utils/src/loadEnvFile';

/* set DB_MODE to 'test' to load the test database */
process.env.DB_MODE = 'test';

/* file header */
import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import 'mocha';

/*
 * Note: All test modules that need a server use index.js or monitor.js to
 * start the server (parhaps on each 'it' function) and then close it
 * before they exit.
 */

before('Before all tests', async () => {});

after('After all tests', async () => {});
