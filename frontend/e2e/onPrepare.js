const { SpecReporter } = require('jasmine-spec-reporter');
const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');
const certFile = path.resolve(__dirname, '..//certs/nodeKeyAndCert.pem')
const keyFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem')
const caFile = path.resolve(__dirname, '../certs/rootCA.crt')
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/* helper function - awaits for an element with the css selector to be visible on the page */
const awaitPage = async (css = 'app-root') => {
  const testPromise = (css = 'app-root') => {
    const EC = ExpectedConditions;
    return EC.visibilityOf(element(by.css(css)));
  }
  await browser.wait(testPromise(css), 5000);
};

/* helper function - sends a request to the server */
const askServer = async(
  url,
  method,
  body = {},
  headers = {},
) => {
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

/* check that the test database is in use */
const testDatabaseInUse = async () => {
  const response
    = await askServer(
      'https://localhost:1337/testServer/isTestDatabase',
      'GET',
    );
  if(!response.isTestDatabase){
    throw new Error('Test database not in use');
  }
}

/* delete all 'test' database members */
const resetDatabase = async () => {

  const options = {
    method: 'POST',
    url: 'https://projectperform.eu.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    body: process.env.AUTH0_REQUEST_BODY,
  };

  const response = await request(options);

  console.log(response);

  const deleteResponse  = await askServer(
    'https://localhost:1337/app-v1/members',
    'DELETE',
    {},
    { authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlFUSkNORE0xTVVVM056YzJSalF6UlRNelJFVTVNRFJFTjBSRlJqYzNPRGsxTmpNNFFVRXhSUSJ9.eyJpc3MiOiJodHRwczovL3Byb2plY3RwZXJmb3JtLmV1LmF1dGgwLmNvbS8iLCJzdWIiOiJqdVFCSVN4ajgxc2ZKNHhyM05MS1pSU095ZXk0VXUzUEBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6MTMzNy9hcGktdjEvIiwiaWF0IjoxNTY2NzY0MjE5LCJleHAiOjE1NjY4NTA2MTksImF6cCI6Imp1UUJJU3hqODFzZko0eHIzTkxLWlJTT3lleTRVdTNQIiwic2NvcGUiOiJhbGw6cGVyZm9ybURCIGFsbDp0ZXN0REIiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.NbOuO93d_G-GgeW0R4_oEmCO_CJfthopX7NHkOunO35aWJLF-jjZa7nMEM7_HrOCx4JcGfRTM4FLvPAFKzY7X1X9LDXb6ccpK1JwO4HI1bMdLYESZgJvzFwP6w3_Gu16PnxzekS_-L70G34B7mwadsWvUa-nBb9LxPxqDMq3OHYLmKcH5SaufLEJH21ldayJ9wNoV_KDfGryvR1a6uG1Gm0svmaLQs2lRUYAgxrM9_40kU-h6cLFsksWpFRtpKAd_0TSJhhjRggI4NTSbSB_EmsSpyS6npiRSsV47lLkS7NplCnGRhQ907z0V664SbOS3F3gkR_wae-kaO6WCoi_XQ' });

  console.log(deleteResponse);
}

/* login */
const login = async() => {
  const { browser, by } = require('protractor');
  const path = require('path');
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

  /* Note: Because waitForAngular is disabled you need to wait until page is shown and all requests have been closed, or otherwise you will see errors such as caching not working. So check for the slowest elements and allow a manual delay. */
  await awaitPage('#logoutBtn');
  await awaitPage('app-messages #clearBtn');
  await browser.sleep(2000);
  await browser.get('/memberslist')
  await browser.sleep(2000);

  // const clearCache = async () => {
  //   await browser.executeScript('window.sessionStorage.clear();');
  //   await browser.executeScript('window.localStorage.clear();');
  // }

  // await clearCache();

  // await browser.refresh();
  // await awaitPage('#logoutBtn');
  // await awaitPage('app-messages #clearBtn');
  // await browser.sleep(2000);

  /* Note: It appears you can only re-enable waitForAngular after all tests - otherwise tests time out. I don't know why I can't re-enable for the Angular pages.
  => commented out for the moment.
  NB: This means I have no angular synchronization after login => caution loading pages!
  */

 await browser.executeScript('console.log(window.getAllAngularTestabilities());');


  await browser.waitForAngularEnabled(true);
  // await browser.refresh();
  await awaitPage('#logoutBtn');

  console.log('Exiting onPrepare');
}

export const run = async () => {
    /* set up a jasmine reporter */
  jasmine
  .getEnv()
  .addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));

  /* set up a jasmine reporter for the html reporter */
  //   .getEnv()
  //   .addReporter(new jasmineReporters.JUnitXmlReporter({
  //     consolidateAll: true,
  //     savePath: './',
  //     filePrefix: 'xmlresults'
  // }));

  // await testDatabaseInUse();
  // await resetDatabase();
  await login();
}
