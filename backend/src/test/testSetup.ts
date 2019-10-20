/* import configuration parameters into process.env */
import '../utils/src/loadEnvFile';

/* set DB_MODE to 'test' (or anything but 'production') to ensure the test database is loaded */
process.env.DB_MODE = 'test';

/* file header */
import { setupDebug } from '../utils/src/debugOutput';
setupDebug(__filename);

/* external dependencies */
import 'mocha';
// import { afterEach, beforeEach } from 'mocha';

/* Note: All test modules that need a server use index.js to start the server (parhaps on each 'it' function) and then close it before they exit. */

// before('Before all tests', async () => {});

/* Creating a Winston logger appears to leave a process 'uncaughtException' listeners.  When this exceeds 10 a warning is output to console.error which can cause tests to fail. See https://github.com/winstonjs/winston/issues/1334. So the following removes any such listeners created within and left after a test. It does remove the listeners created when logger.js is called outside of a test but that results in only 2 listeners. */

let beforeCount = 0;
let originalTestPaths: string | undefined;
beforeEach('Before each test', () => {
  /* open testServer routes */
  originalTestPaths = process.env.TEST_PATHS;
  process.env.TEST_PATHS = 'true';
  /* count listeners */
  beforeCount = process.listenerCount('uncaughtException');
});

afterEach('After each test', () => {
  /* reset testServer routes setting */
  process.env.TEST_PATHS = originalTestPaths;
  const afterCount = process.listenerCount('uncaughtException');
  /* close listeners */
  const arrayListeners = process.listeners('uncaughtException');
  if (afterCount > beforeCount) {
    process.removeListener(
      'uncaughtException',
      arrayListeners[arrayListeners.length - 1],
    );
  }
});

// after('After all tests', async () => {});
