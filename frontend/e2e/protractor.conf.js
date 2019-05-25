// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');
const certFile = path.resolve(__dirname, './certs/nodeKeyAndCert.pem')
const keyFile = path.resolve(__dirname, './certs/nodeKeyAndCert.pem')
const caFile = path.resolve(__dirname, './certs/rootCA.crt')

/* server request helper function */
async function askServer(url, method, body = {}) {
  let options = {
    url,
    method,
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
    ca: fs.readFileSync(caFile),
    json: true,
    body,
  }
  return await request(options);
}

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './src/**/*.e2e-spec.ts',
  ],
  directConnect: true,
  chromeDriver:
    '../node_modules/protractor/node_modules/webdriver-manager/selenium/chromedriver_2.46.exe',
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
  },
  baseUrl: 'https://localhost:1337/',
  SELENIUM_PROMISE_MANAGER: false,
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {},
  },
  onPrepare: async () => {

    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json'),
    });

    /* set up jasmine reporter */
    jasmine
      .getEnv()
      .addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));

    /* check test database in use */
    let response
      = await askServer('https://localhost:1337/isTestDatabase', 'GET');
    if(!response.isTestDatabase){
      throw new Error('Test database not in use');
    }
    /* delete all 'test' database members */
    await askServer('https://localhost:1337/members', 'DELETE');

    return;

  },

};
