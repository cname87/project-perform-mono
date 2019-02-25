/**
 * This module is loaded first by the loadMocha html page
 * and loads mocha, chai and sinon and sets up mocha.
 */

import 'https://unpkg.com/mocha/mocha.js';
import 'https://unpkg.com/chai/chai.js';
import 'https://unpkg.com/sinon/pkg/sinon.js';

mocha.setup({
    ui: 'bdd',
    timeout: 0,
    ignoreLeaks: true,
    globals: ['*'],
});
