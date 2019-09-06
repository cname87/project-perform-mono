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

/* helper function - awaits for an element with the css selector to be visible on the page */
const awaitPage = async (css = 'app-root') => {
  const testPromise = (css = 'app-root') => {
    const EC = ExpectedConditions;
    return EC.visibilityOf(element(by.css(css)));
  }
  await browser.wait(testPromise(css), 5000);
};

/* checks that all but 1 macro task is open - this macro task is due to the auth0 client setting a timer to expire the token so you have to account for it whenever you are logged in */
const awaitStabilityWhenLogginIn = async () => {
  const isStable = () => browser.executeScript(
    `const ngZone = window.getAllAngularTestabilities()[0]._ngZone;
     return (ngZone.hasPendingMacrotasks === 1) && (ngZone.hasPendingMicroTasks === 0);`);
  await browser.wait(isStable(), 5000);
}

/* helper function - sends a request to the server */
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
  }
}

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
}

const clearCache = async () => {
  await browser.executeScript('window.sessionStorage.clear();');
  await browser.executeScript('window.localStorage.clear();');
}

/* login */
const login = async() => {

  await browser.get('/');
  await browser.driver.findElement(by.id('loginBtn')).click();

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
  await awaitPage('#logoutBtn');
  await awaitPage('app-messages #clearBtn');
  await awaitStabilityWhenLogginIn();

  /* Note: It appears you can only re-enable waitForAngular after all tests - otherwise tests time out. I don't know why I can't re-enable for the Angular pages.
  => commented out for the moment.
  NB: This means I have no angular synchronization after login => caution loading pages!
  */

  //await browser.waitForAngularEnabled(true);

  console.log('Exiting login()');
}

export const run = async () => {
    /* set up a jasmine reporter */
  jasmine
  .getEnv()
  .addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));

  await testDatabaseInUse();
  await resetDatabase();
  // await clearCache();
  await login();
}
