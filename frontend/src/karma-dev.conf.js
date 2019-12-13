// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html


/* Set path to the Chrome executable */
process.env.CHROME_BIN = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

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
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false
  });
};
