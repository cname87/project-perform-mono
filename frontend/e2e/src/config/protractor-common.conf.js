const findup = require('find-up');
const path = require('path');
const tsNode = require('ts-node');
const puppeteer = require('puppeteer');

/* required paths */
const specDirPath = '../spec-files';
const tsConfigPath = findup.sync('tsconfig.e2e.json');
const chromeWinPath =
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const chromeLinuxPath = '/usr/bin/google-chrome';

let chromeExe = '';
switch (process.platform) {
  case 'linux':
    chromeExe = chromeLinuxPath;
    break;
  case 'win32':
    chromeExe = chromeWinPath;
    break;
  default:
    chromeExe = chromeLinuxPath;
    break;
}

const chromePath =
  process.env.IS_LOCAL === 'true' ? chromeExe : puppeteer.executablePath();

const showColors = process.env.IS_LOCAL === 'true';

let chromeOptions = [
  '--headless', // needed for Docker
  '--no-sandbox', // needed for Docker
  '--window-size=800,600',
  '--incognito',
  '--start-maximized',
  '--new-window',
  '--disable-popup-blocking',
  '--disable-extensions',
];

if (process.env.IS_LOCAL === 'true') {
  chromeOptions = chromeOptions.filter(
    (item) => item !== '--headless' && item !== '--no-sandbox',
  );
}

let specFiles = [
  'app.e2e-spec.ts',
  'auth.e2e-spec.ts',
  'cache.e2e-spec.ts',
  'errors.e2e-spec.ts',
];

/* filter test files per environment settings */
specFiles = specFiles.filter((item) => {
  const a =
    item === process.env.SPEC_FILE_1 ||
    item === process.env.SPEC_FILE_2 ||
    item === process.env.SPEC_FILE_3 ||
    item === process.env.SPEC_FILE_4;
  return a;
});

specFiles = specFiles.map((item) => path.join(specDirPath, item));

if (process.env.BASE_URL) {
  console.log(`Configured baseUrl: ${process.env.BASE_URL}`);
} else {
  throw new Error('No baseUrl configured. Possible .env file issue?');
}

exports.config = {
  /* direct connect to browser drivers */
  directConnect: true,

  /* tests to run - spec patterns are relative to this config file */
  specs: specFiles,

  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: chromeOptions,
      binary: chromePath,
    },
    /* enable browser logs for protractor-browser-logs */
    loggingPrefs: {
      browser: 'ALL', // "OFF", "SEVERE", "WARNING", "INFO", "CONFIG", "FINE", "FINER", "FINEST", "ALL".
    },
  },

  /* a base URL for your application under test. Calls to protractor.get() with relative paths will be resolved against this URL (via url.resolve) */
  baseUrl: `${process.env.BASE_URL}`,
  /* the timeout in milliseconds for each script run on the browser */
  allScriptsTimeout: 60000,
  /* how long to wait for a page to load */
  getPageTimeout: 60000,
  /* CAUTION: If your app decorates $timeout, you must turn on this flag. This is false by default (?) */
  untrackOutstandingTimeouts: true,
  /* protractor log level */
  logLevel: 'INFO',

  /* test framework to use */
  framework: 'jasmine',

  /* Options to be passed to jasmine */
  jasmineNodeOpts: {
    showColors,
    defaultTimeoutInterval: 60000,
    /* function called to print jasmine results */
    print() {},
  },
  /* set false to manage the control flow directly rather than having Protractor use its control flow */
  SELENIUM_PROMISE_MANAGER: false,

  /* a callback function called once configs are read but before any environment setup. This will only run once, and before onPrepare */
  beforeLaunch() {
    tsNode.register({
      project: tsConfigPath,
    });
  },

  /* a callback function called once protractor is ready and available, and before the specs are executed */
  /* resets database and logs in */
  onPrepare: async () => {
    // eslint-disable-next-line global-require
    await require('./onPrepare').run();
  },

  /* a callback function called once tests are finished */
  onComplete() {
    console.log('E2e test complete');
  },
};
