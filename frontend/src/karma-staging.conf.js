// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

import karmaJasmine from 'karma-jasmine';
import karmaChromeLauncher from 'karma-chrome-launcher';
import karmaJasmineHtmlReporter from 'karma-jasmine-html-reporter';
import karmaCoverageIstanbulReporter from 'karma-coverage-istanbul-reporter';
import angularDevkitPluginKarma from '@angular-devkit/build-angular/plugins/karma';

/* Set path to the Chrome executable - using Chromium from Puppeteer for GCP */
process.env.CHROME_BIN = require('puppeteer').executablePath();

export default function main(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      karmaJasmine,
      karmaChromeLauncher,
      karmaJasmineHtmlReporter,
      karmaCoverageIstanbulReporter,
      angularDevkitPluginKarma,
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        random: false,
        seed: '4321',
        oneFailurePerSpec: true,
        failFast: true,
        timeoutInterval: 30000,
      },
    },

    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: false,
    logLevel: config.LOG_INFO,
    autoWatch: false,

    /* choose browser in angular.json configuration */
    //  browsers: ['Chrome', 'ChromeHeadless_NoSandbox'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'], // needed for GCP Docker build
        displayName: 'ChromeHeadlessNoSandbox',
      },
    },
    singleRun: true,
  });
}
