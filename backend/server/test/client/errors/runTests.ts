/* import types to avoid text editor tslint errors */
/// <reference types='@types/mocha' />
/// <reference types='@types/chai' />

/**
 * This module calls client-side tests that test server error handling.
 */

/* tests server errorhandler */
import '/testServer/errors/errors.client-test.js';

mocha.checkLeaks();
mocha.run();
