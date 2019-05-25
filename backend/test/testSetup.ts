/* import configuration parameters into process.env */
/* the .env file must be in process.cwd() */
import * as dotenv from 'dotenv';
dotenv.config();
/* set TEST_MODE to true to load the test database */
process.env.TEST_MODE = 'true';

/* file header */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
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
