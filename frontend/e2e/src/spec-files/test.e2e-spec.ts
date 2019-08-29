/**
 * Scratch test module.
 */
import { browser, by } from 'protractor';

import { getDashboardPage } from '../pages/dashboard.page';
// import { getHelpers } from '../e2e-helpers';
import { getLoginPage } from '../pages/login.page';


describe('Login', () => {

  xit('Logs in', async () => {
    await browser.get('/');
    const loginPage = getLoginPage();

    /* disable wait for angular (as aut0 has redirected and therefore the page is not seen as an angular page?) */
    await browser.waitForAngularEnabled(false);

    await loginPage.rootElements.loginBtn.click();

    /* log-in on the non-angular auth0 page using the selenium webdriver */
    // const nameInput = await browser.driver.findElement(by.name('username'));
    // await nameInput.sendKeys(process.env.TEST_EMAIL as string);
    // const passwordInput = await browser.driver.findElement(by.name('password'));
    // await passwordInput.sendKeys(process.env.TEST_PASSWORD as string);
    // const continueButton = await browser.driver.findElement(by.css('.ulp-button'));
    // await continueButton.click();

    const nameInput = await browser.driver.findElement(by.name('username'));
    await nameInput.sendKeys('test-team-owner@perform.com');
    const passwordInput = await browser.driver.findElement(by.name('password'));
    await passwordInput.sendKeys('testPerforM#1');
    const continueButton = await browser.driver.findElement(by.css('.ulp-button'));
    await continueButton.click();

    /* Note: Because waitForAngular is disabled you need to wait until page is shown and all requests have been closed, or otherwise you will see errors such as caching not working. So check for the slowest elements and allow a manual delay. */
    // await awaitPage('#logoutBtn');
    // await awaitPage('app-messages #clearBtn');
    await browser.sleep(2000);

    /* Note: Tried restarting to allow angular sync but no joy. */
    // await browser.get('/');
    // await awaitPage('#logoutBtn');
    // await awaitPage('app-messages #clearBtn');
    // await browser.sleep(1000);

    /* the dashboard page is now shown - following auth0 redirection */
    const dashboardPage = getDashboardPage();
    expect(await dashboardPage.rootElements.logoutBtn.isDisplayed())
      .toBeTruthy();
    expect(await dashboardPage.dashboardElements.topMembers
      .isDisplayed()).toBeTruthy();

    /* Note: It appears you can only re-enable this after all tests - otherwise tests time out. I don't know why I can't re-enable for the Angular pages. */
    await browser.waitForAngularEnabled(true);

  });
});

describe('Tests', () => {

  // const {
  //   // awaitPage,
  //   loadRootPage,
  //   // login,
  //   // originalTimeout,
  //   // setTimeout,
  //   // resetTimeout,
  //   // resetDatabase,
  //   // setupLogsMonitor,
  //   // checkLogs,
  // } = getHelpers();

  beforeAll(async () => {
    /* test that test database is in use and reset it */
    // await resetDatabase();
    // setTimeout();
    // await loadRootPage('#loginBtn');
    // await login();
  });

  // afterAll(() => {
  //   resetTimeout(originalTimeout);
  // });

  it('TEST1', async () => {

    // const logs = await setupLogsMonitor(false);

    // /* set up test logs to show that you've read from the server */
    // logs.ignore((message) => {
    //   return message.message
    //     .indexOf("CachingInterceptor: reading from server") === -1;
    // });
    // logs.expect(/CachingInterceptor: reading from server/, logs.INFO);

    /* open new page to generate a read from server */
    console.log('Before get');
    await browser.get('/');
    await browser.sleep(1000);
    console.log('Before await page');
    // await awaitPage();
    console.log('Before await get url');
    expect(await browser.driver.getCurrentUrl())
    .toBe('https://localhost:1337/dashboard');
    // await awaitPage('#logoutBtn');
    // await awaitPage('app-messages #clearBtn');
    // await browser.sleep(1000);

    console.log('Before get page');
    /* the dashboard page should be displayed */
    // const dashboardPage = getDashboardPage();

    console.log('Before driver await');

    expect(await browser.driver.findElement(by.css('app-messages #clearBtn')).isDisplayed()).toBeTruthy();

    console.log('Before final await');

    expect(await browser.driver.findElement(by.css('app-messages #clearBtn')).isDisplayed()).toBeTruthy();

    // expect(await dashboardPage.dashboardElements.topMembers
    //   .isDisplayed()).toBeTruthy();

      console.log('After final await!');

    // await checkLogs(logs);
  });

});
