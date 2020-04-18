// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

import karmaJasmine from 'karma-jasmine';
import karmaChromeLauncher from 'karma-chrome-launcher';
import karmaJasmineHtmlReporter from 'karma-jasmine-html-reporter';
import karmaCoverageIstanbulReporter from 'karma-coverage-istanbul-reporter';
import angularDevkitPluginKarma from '@angular-devkit/build-angular/plugins/karma';
import { join } from 'path';

/* Set path to the Chrome executable */
switch (process.platform) {
  case 'linux':
    process.CHROME_BIN = '/usr/bin/google-chrome';
    break;
  case 'win32':
    process.CHROME_BIN =
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    break;
  default:
    process.CHROME_BIN = '/usr/bin/google-chrome';
    break;
}

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
    coverageIstanbulReporter: {
      dir: join(__dirname, '../coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true,
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,
  });
}
