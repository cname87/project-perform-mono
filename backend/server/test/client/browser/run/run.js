/**
 * This module calls the client-side tests of the server.
 */

import '/testServer/browser/testroot.js';
import '/testServer/browser/page-test.js';
import '/testServer/browser/file-test.js';
import '/testServer/browser/app-test.js';
import '/testServer/browser/errors-test.js';

mocha.checkLeaks();
mocha.run();
