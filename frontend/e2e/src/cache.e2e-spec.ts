/**
 * This module tests cache functionality.
 */

import { browser, by } from 'protractor';
import browserLogs from 'protractor-browser-logs';

import { resetDatabase} from '../../utils/reset-testDatabase';
import { getDashboardPage } from './pages/dashboard.page';


describe('The Cache', () => {

  /* holds browser logs utility */
  let logs: browserLogs.BrowserLogs;
  /* set timeout here - loaded in beforeAll below */
  const timeout = 120000;

  /* loads start page */
  const loadRootPage = async () => {
    /* load the root page */
    await browser.get('/');
    browser.ignoreSynchronization = true;
    await browser.wait(() => {
      return browser.isElementPresent(by.css('app-root'));
    }, 5000);
    browser.ignoreSynchronization = false;
  };

  /* check test database and set timeout */
  let originalTimeout: number;
  beforeAll(async () => {
    /* test that test database is in use and reset it */
    await resetDatabase();
    /* set timeout to allow for debug */
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  /* clear database and reset timeout value to the original value */
  afterAll(async () => {
    /* reset timeout */
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  beforeEach(function () {
    /* note: logs captures the browser log in total not just from when created (and logs.reset() does not clear logs) => clear browser log before test */
    browser.manage().logs().get('browser');
    logs = browserLogs(browser);
  });

  afterEach(() => {
    return logs.verify();
  });


  it('first reads `get all members` from the server', async () => {
    /* ignore all but the expected message */
    logs.ignore(function (message) {
      return message.message.indexOf("CachingInterceptor: reading from server") === -1;
    });
    /* test logs to show that you've read from the server */
    logs.expect(/CachingInterceptor: reading from server/, logs.INFO);
    /* load page to generate log */
    await loadRootPage();
    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();
    expect(await dashboardPage.dashboardElements.tag.isPresent()).toBeTruthy();
  });

  it('then reads `get all members` from the cache', async () => {
    /* ignore all but the expected message */
    logs.ignore(function (message) {
      return message.message.indexOf('CachingInterceptor: reading from cache') === -1;
    });
    /* test logs to show that you've read from the cache */
    logs.expect(/CachingInterceptor: reading from cache/);
    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();
    /* click on members list link and pass in number of members expected */
    await dashboardPage.rootElements.membersLink.click();
    // await getMembersList(expected.numMembers);
  });

});
