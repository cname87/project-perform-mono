/**
 * This module tests cache functionality.
 */
import { browser } from 'protractor';

import { getDashboardPage } from '../pages/dashboard.page';
import { getHelpers } from '../e2e-helpers';

describe('Cache', () => {

  const {
    awaitPage,
    loadRootPage,
    login,
    originalTimeout,
    setTimeout,
    resetTimeout,
    // resetDatabase,
    setupLogsMonitor,
    checkLogs,
  } = getHelpers();

  beforeAll(async () => {
    /* test that test database is in use and reset it */
    // await resetDatabase();
    setTimeout();
    await loadRootPage('#loginBtn');
    await login();
  });

  afterAll(() => {
    resetTimeout(originalTimeout);
  });

  it('first reads `get all members` from the server', async () => {

    const logs = await setupLogsMonitor(false);

    /* set up test logs to show that you've read from the server */
    logs.ignore((message) => {
      return message.message
        .indexOf("CachingInterceptor: reading from server") === -1;
    });
    logs.expect(/CachingInterceptor: reading from server/, logs.INFO);

    /* open new page to generate a read from server */
    await browser.get('/');
    await awaitPage('#logoutBtn');
    await awaitPage('app-messages #clearBtn');
    await browser.sleep(1000);

    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();

    expect(await dashboardPage.dashboardElements.topMembers
      .isDisplayed()).toBeTruthy();

    await checkLogs(logs);
  });

  it('then reads `get all members` from the cache', async () => {

    const logs = await setupLogsMonitor(false);

    /* ignore all but the expected message */
    logs.ignore(function (message) {
      return message.message
        .indexOf('CachingInterceptor: reading from cache') === -1;
    });
    /* test logs to show that you've read from the cache */
    logs.expect(/CachingInterceptor: reading from cache/);

    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();

    /* click on members list link to generate log */
    await dashboardPage.rootElements.membersLink.click();

    await awaitPage('app-members');
    await awaitPage('app-messages #clearBtn');
    await browser.sleep(1000);

    expect(await dashboardPage.rootElements.bannerHeader
      .isDisplayed()).toBeTruthy();

    await checkLogs(logs);
  });
});
