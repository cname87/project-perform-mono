/**
 * This module calls client-side tests that test server error handling.
 */

/* tests server error handler */
import '/testServer/errors.client-test.js';

mocha.checkLeaks();
mocha.run();
