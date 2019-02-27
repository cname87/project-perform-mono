/**
 * This module calls the client-side tests of the server.
 */

import '/testServer/testroot.js';
import '/testServer/page-test.js';
import '/testServer/file-test.js';
import '/testServer/errors-test.js';

mocha.checkLeaks();
mocha.run();
