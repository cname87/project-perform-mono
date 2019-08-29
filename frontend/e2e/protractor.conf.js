// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

// const jasmineReporters = require('jasmine-reporters');

exports.config = {
  allScriptsTimeout: 11000,
  /* spec patterns are relative to the current working directory when protractor is called */
  specs: [
    './src/**/test.e2e-spec.ts',
    // './src/**/auth.e2e-spec.ts',
    // './src/**/cache.e2e-spec.ts',
    // './src/**/errors.e2e-spec.ts',
  ],
  directConnect: true,
  capabilities: {
    browserName: 'chrome',
    'chromeOptions': {
      'args': [
        "--incognito",
        "--start-maximized",
        "--new-window",
        "--disable-popup-blocking",
      ]
    },
    /* enable browser logs for protractor-browser-logs */
    loggingPrefs: {
      browser: 'ALL' // "OFF", "SEVERE", "WARNING", "INFO", "CONFIG", "FINE", "FINER", "FINEST", "ALL".
    }
  },
  baseUrl: 'https://localhost:1337/',
  allScriptsTimeout: 10000,
  getPageTimeout: 10000,
  untrackOutstandingTimeouts: true,
  logLevel: 'DEBUG',

  SELENIUM_PROMISE_MANAGER: false,
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 10000,
    print: function() {},
  },

  beforeLaunch: function() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json')
    });
  },

  /* test environment setup - reset database and log in */
  onPrepare: async () => {

    await require('./onPrepare').run();

  },

  // onComplete: function() {
  /* HTMLReport called once tests are finished */
  //   var browserName, browserVersion;
  //   var capsPromise = browser.getCapabilities();

  //   capsPromise.then(function (caps) {
  //      browserName = caps.get('browserName');
  //      browserVersion = caps.get('version');

  //      var HTMLReport = require('protractor-html-reporter');

  //     testConfig = {
  //           reportTitle: 'Shield End To End Testing Report',
  //           outputPath: './',
  //           screenshotPath: './',
  //           testBrowser: browserName,
  //           browserVersion: browserVersion,
  //           modifiedSuiteName: false,
  //           screenshotsOnlyOnFailure: true
  //       };
  //       new HTMLReport().from('xmlresults.xml', testConfig);
  //   });
  // }

};
