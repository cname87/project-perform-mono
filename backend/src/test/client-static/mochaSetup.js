/* import types to avoid text editor tslint errors */
/// <reference types='@types/mocha' />
/// <reference types='@types/chai' />

/**
 * This module is loaded first by the loadMocha html page
 * and loads mocha, chai and sinon and sets up mocha.
 * (Must be loaded first in a separate file as Mocha global variable set up needed before test file imports and test file imports would run first if all in the same file due to static nature of ES6 modules).
 */

// tslint:disable: no-implicit-dependencies
import 'https://unpkg.com/mocha/mocha.js';
import 'https://unpkg.com/chai/chai.js';
import 'https://unpkg.com/sinon/pkg/sinon.js';

mocha.setup({
  ui: 'bdd',
  timeout: 0,
  ignoreLeaks: true,
  globals: ['*'],
});
