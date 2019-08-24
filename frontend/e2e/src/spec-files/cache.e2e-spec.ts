/**
 * This module tests cache functionality.
 */

import { getDashboardPage } from '../pages/dashboard.page';
import { getHelpers } from '../e2e-helpers';
import { browser } from 'protractor';

fdescribe('Cache', () => {

  const {
    awaitPage,
    loadRootPage,
    // createExpected,
    login,
    originalTimeout,
    setTimeout,
    resetTimeout,
    // resetDatabase,
    setupLogsMonitor,
    checkLogs,
  } = getHelpers();

  // let { logs } = getHelpers();

  /* check test database and set timeout */
  beforeAll(async () => {
    /* test that test database is in use and reset it */
    // await resetDatabase();
    setTimeout();
    // await loadRootPage('#loginBtn');
    // await login();
  });

  afterAll(() => {
    resetTimeout(originalTimeout);
  });

  it('first reads `get all members` from the server', async () => {

    const logs = await setupLogsMonitor()

    /* ignore all but the expected message */
    logs.ignore((message) => {
      return message.message
        .indexOf("CachingInterceptor: reading from server") === -1;
    });
    /* test logs to show that you've read from the server */
    logs.expect(/CachingInterceptor: reading from server/, logs.INFO);

    /* load page and log in to generate log */
    await loadRootPage('#loginBtn');
    await login();

    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();

    /* Note: Necessary - due to earlier auth0 call? */
    await browser.waitForAngularEnabled(false);

    expect(await dashboardPage.dashboardElements.topMembers
      .isDisplayed()).toBeTruthy();

    await checkLogs(logs);
    await browser.waitForAngularEnabled(true);
  });

  it('then reads `get all members` from the cache', async () => {

    const logs = await setupLogsMonitor();

    /* ignore all but the expected message */
    logs.ignore(function (message) {
      return message.message
        .indexOf('CachingInterceptor: reading from cache') === -1;
    });
    /* test logs to show that you've read from the cache */
    logs.expect(/CachingInterceptor: reading from cache/);

    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();

    await browser.waitForAngularEnabled(false);
    /* click on members list link to generate log */
    await dashboardPage.rootElements.membersLink.click();

    /* Note: Because waitForAngular is disabled you need to wait until page is shown and all requests have been closed, or otherwise you will see errors such as caching not working. So check for the slowest elements and allow a manual delay. */
    await awaitPage('app-members');
    await browser.sleep(1000);

    expect(await dashboardPage.rootElements.bannerHeader
      .isDisplayed()).toBeTruthy();

    await checkLogs(logs);
    await browser.waitForAngularEnabled(true);
  });
});
