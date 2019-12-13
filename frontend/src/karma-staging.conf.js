// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html


/* Set path to the Chrome executable - using Chromium from Puppeteer for GCP */
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        random: false,
        seed: '4321',
        oneFailurePerSpec: true,
        failFast: true,
        timeoutInterval: 30000
      }
    },

    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: false,
    logLevel: config.LOG_INFO,
    autoWatch: false,

    /* choose browser in angular.json configurations */
    //  browsers: ['Chrome', 'ChromeHeadless_NoSandbox'],

    customLaunchers: {
      ChromeHeadless_NoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],  // needed for GCP Docker build
        displayName: 'ChromeHeadless_NoSandbox'
      }
    },
    singleRun: true
  });
};
