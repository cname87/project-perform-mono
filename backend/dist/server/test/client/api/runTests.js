/**
 * This module calls client-side tests that normal operation including the api specification.
 */
/* tests api as defined in openapi.json & other page tests */
import '/testServer/api/api-requests.client-test.js';
mocha.checkLeaks();
mocha.run();
//# sourceMappingURL=runTests.js.map