const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { browser, by } = require('protractor');
const { SpecReporter } = require('jasmine-spec-reporter');
const request = require('request-promise-native');
const fs = require('fs');
const {promisify} = require('util');

const certFile = path.resolve(__dirname, '..//certs/nodeKeyAndCert.pem')
const keyFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem')
const caFile = path.resolve(__dirname, '../certs/rootCA.crt')

import { getDashboardPage } from './src/pages/dashboard.page';
import { getRootElements } from './src/pages/elements/root.elements';

/**
 * This module...
 * - sets up a jasmine reporter
 * - tests that the test database is being used (or throws an error if not)
 * - resets the database by clearing and loading mock members
 * - loads the root page
 * - checks that the app has been built with e2e environment so e2eTesting is true as required by the errors spec file
 * - logins the app vai OAuth0
 * - sets the jasmine default timeout
 * - exports various helper functions including an await element visible helper
 */

/* awaits for an element to be visible on the page */
const awaitElementVisible = async (element) => {
  return await browser.wait(ExpectedConditions.visibilityOf(element), 5000);
};

/* awaits for an element to be invisible on the page */
const awaitElementInvisible = async (element) => {
  return await browser.wait(ExpectedConditions.invisibilityOf(element), 5000);
};

/* sends a configured request to the server */
const askServer = async(
  url,
  method,
  body = {},
  headers = {},
  resolveWithFullResponse = false, // get either the full response or the body
) => {
  let options = {
    url,
    method,
    headers,
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
    ca: fs.readFileSync(caFile),
    body,
    resolveWithFullResponse,
    json: true,
  }
  return await request(options);
}

/* check that the test database is in use */
const testDatabaseInUse = async () => {
  const testDatabaseResponseBody
    = await askServer(
      'https://localhost:1337/testServer/isTestDatabase',
      'GET',
    );
  /* body will contain { isTestDatabase: <boolean> } */
  if(!testDatabaseResponseBody.isTestDatabase){
    throw new Error('Test database not in use');
  } else {
    console.log('Test database in use')
  }
}

/* define mock members */
const errorMember = {
  id: 10,
  name: 'errorName',
};
export const mockMembers = [
  { name: 'test10' },
  { name: 'test11' },
  { name: 'test12' },
  { name: 'test13' },
  { name: 'test14' },
  { name: 'test15' },
  { name: 'test116' },
  { name: 'test117' },
  { name: 'test118' },
  { name: errorMember.name }, // used for error testing
];

/* delete all 'test' database members */
const resetDatabase = async () => {

  /* request a token */
  const options = {
    method: 'POST',
    url: 'https://projectperform.eu.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    body: process.env.AUTH0_REQUEST_BODY,
  };
  /* the response body will contain "{"access_token":"xxx...", ... }"*/
  const tokenRequestBody = await request(options);
  const token = JSON.parse(tokenRequestBody).access_token;

  /* delete all members in the test database */
  const deleteResponseBody  = await askServer(
    'https://localhost:1337/api-v1/members',
    'DELETE',
    {},
    { Authorization: `Bearer ${token}` },
  );
  /* the response body will contain { count: <integer> } */
  if(!Number.isInteger(deleteResponseBody.count)) {
    throw new Error('Error resetting test database');
  }

  /* add test database members here */
  for (const member of mockMembers) {
    await askServer(
      'https://localhost:1337/api-v1/members',
      'POST',
      member,
      { Authorization: `Bearer ${token}` },
    );
  }

  console.log('Completed database reset and loaded test members');
}

/**
 * Loads the root page and awaits either the log in button or the message saying that members have been loaded from the server (or not).
 * @param isLoggedIn: Says whether we expect the log in page or the logged in dashboard page.
 */
const loadRootPage = async (isLoggedIn = true, numberExpected = 4) => {
  console.log('Loading root page');
  await browser.get('/');
  if (!isLoggedIn) {
    /* just wait for the login button to show */
    await awaitElementVisible(getRootElements().loginBtn);
  } else {
    /* await the appearance of the progress bar as should be loading from the database server */
    await awaitElementVisible(getRootElements().progressBar);

    /* the dashboard page is now displayed */
    const dashboardPage = getDashboardPage();

    /* await the dashboard */
    await awaitElementVisible(dashboardPage.dashboardElements.tag);

    /* test resolver prevents the page loading until data is available by testing for the members presence without browser.wait */
    expect(await dashboardPage.dashboardElements.topMembers.count()).toEqual(numberExpected);

    /* await the disappearance of the progress bar */
    await awaitElementInvisible(getRootElements().progressBar);

    /* await the message denoting the loading of members appears as this is slow to appear */
    await browser.wait(async () => {
      return (
        await getRootElements().messages.count()
          === 1
      );
    }, 10000);
  }
  console.log('Root page loaded');
};

/* check that the e2e build environment is in use - this is needed for the error testing spec file */
const checkE2eEnvironment = async () => {
  /* the app-login element is configured with a custom attribute */
  const el = browser.findElement(by.css('app-login'));
  const isE2eTesting = await el.getAttribute('data-environment');
  if(isE2eTesting === 'true'){
    console.log(`E2e build environment in use`);
  } else {
    throw new Error('E2e build environment not in use');
  }
}

/* login - assumes the non-logged in root page is open */
const login = async() => {

  console.log('Beginning login routine');

  await browser.findElement(by.id('loginBtn')).click();

  /* disable wait for angular (as auth0 has redirected and therefore the page is not seen as an angular page?) */
  await browser.waitForAngularEnabled(false);

  /* log-in on the non-angular auth0 page using the selenium webdriver */
  const nameInput = await browser.driver.findElement(by.name('username'));
  await nameInput.sendKeys(process.env.TEST_EMAIL);
  const passwordInput = await browser.driver.findElement(by.name('password'));
  await passwordInput.sendKeys(process.env.TEST_PASSWORD);
  const continueButton = await browser.driver.findElement(by.css('.ulp-button'));
  await continueButton.click();

  /* Note: Because waitForAngular is disabled you need to wait until page is shown and all asynchronous operations have been closed, or otherwise you will see intermittent errors such as caching not working. So check for the slowest elements and manually check for stability. */
  await awaitElementVisible(getRootElements().logoutBtn);
  await awaitElementVisible(getRootElements().messagesClearBtn);

  /* When logged in you can't re-enable waitForAngular as tests will time out.
  NB: This means I have no angular synchronization after login
    => after load pages await visibility of an item, and then
    => browser.wait() for anything you are going to test.
  */

  console.log('Completed login routine');
}

/* set long timeout to allow for debug */
const setTimeout = (timeout = 120000) => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
}
export const run = async () => {
  /* set up a jasmine reporter */
  jasmine
    .getEnv()
    .addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));

  await testDatabaseInUse();
  await resetDatabase();
  await loadRootPage(false);
  await checkE2eEnvironment();
  await login();
  setTimeout(120000);
}

/* export login */
module.exports.mockMembers = mockMembers;
module.exports.resetDatabase = resetDatabase;
module.exports.loadRootPage = loadRootPage;
module.exports.login = login;
module.exports.setTimeout = setTimeout;
module.exports.awaitElementVisible = awaitElementVisible;
module.exports.awaitElementInvisible = awaitElementInvisible;
