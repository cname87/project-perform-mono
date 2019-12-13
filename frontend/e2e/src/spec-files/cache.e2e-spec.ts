/**
 * This module tests cache functionality.
 */
import { browser } from 'protractor';

import { getDashboardPage } from '../pages/dashboard.page';
import { getHelpers } from '../helpers/e2e-helpers';

describe('Cache', () => {
  const {
    loadRootPage,
    originalTimeout,
    setTimeout,
    resetTimeout,
    resetDatabase,
    setupLogsMonitor,
    checkLogs,
    getMembersList,
  } = getHelpers();

  /* Note: app must start in logged in state */

  beforeAll(async () => {
    /* test that test database is in use and reset it */
    await resetDatabase();
    setTimeout(120000);
  });

  afterAll(() => {
    resetTimeout(originalTimeout);
  });

  it('first reads `get all members` from the server', async () => {
    const logs = await setupLogsMonitor(false);

    /* set up test logs to show that you've read from the server */
    logs.ignore((message) => {
      return (
        message.message.indexOf('CachingInterceptor: reading from server') ===
        -1
      );
    });
    logs.expect(/CachingInterceptor: reading from server/, logs.INFO);

    /* reopen root page to generate a read from server */
    await loadRootPage();

    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();

    /* the top members should be shown */
    await browser.wait(async () => {
      return await dashboardPage.dashboardElements.topMembers.isDisplayed();
    });

    await checkLogs(logs);
  });

  it('then reads `get all members` from the cache', async () => {
    const logs = await setupLogsMonitor(false);

    /* ignore all but the expected message */
    logs.ignore(function(message) {
      return (
        message.message.indexOf('CachingInterceptor: reading from cache') === -1
      );
    });
    /* test logs to show that you've read from the cache */
    logs.expect(/CachingInterceptor: reading from cache/);

    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();

    /* click on members list link */
    await getMembersList(10);

    expect(
      await dashboardPage.rootElements.bannerHeader.isDisplayed(),
    ).toBeTruthy();

    await checkLogs(logs);
  });
});
