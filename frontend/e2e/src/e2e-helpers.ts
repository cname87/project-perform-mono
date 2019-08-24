/**
 * This module provides a function that returns common helper functions.
 */

import { browser, by, ExpectedConditions, element } from 'protractor';
import browserLogs from 'protractor-browser-logs';
import path = require('path');
import dotenv = require('dotenv');

import { getLoginPage } from './pages/login.page';
import { getDashboardPage } from './pages/dashboard.page';
import { resetDatabase} from '../../utils/reset-testDatabase';

export const getHelpers = () => {

  /* awaits for an element with the css selector to be visible on the page */
  const awaitPage = async (css = 'app-root') => {
    const testPromise = (css = 'app-root') => {
      const EC = ExpectedConditions;
      return EC.visibilityOf(element(by.css(css)));
    }
    await browser.wait(testPromise(css), 5000);
  };

  const loadRootPage = async (css = 'app-root') => {
    await browser.get('/');
    await awaitPage(css);
  };

  const createExpected = () => {
    return {
      profileName: 'seany',
      profileEmail: 'sean.young@openet.com',
      profilePassword: 'perforM#1',
    };
  };

  const login = async () => {

    // const { profileEmail, profilePassword } = createExpected();
    /* import test authentication parameters into process.env */
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });

    /* the login page is still shown */
    const loginPage = getLoginPage();

    /* disable wait for angular (as auth0 has redirected and therefore the page is not seen as an angular page?) */
    await browser.waitForAngularEnabled(false);

    await loginPage.rootElements.loginBtn.click();

    /* log-in on the non-angular auth0 page using the selenium webdriver */
    const nameInput = await browser.driver.findElement(by.name('username'));
    await nameInput.sendKeys(process.env.TEST_EMAIL as string);
    const passwordInput = await browser.driver.findElement(by.name('password'));
    await passwordInput.sendKeys(process.env.TEST_PASSWORD as string);
    const continueButton = await browser.driver.findElement(by.css('.ulp-button'));
    await continueButton.click();

    /* Note: Because waitForAngular is disabled you need to wait until page is shown and all requests have been closed, or otherwise you will see errors such as caching not working. So check for the slowest elements and allow a manual delay. */
    await awaitPage('#logoutBtn');
    await awaitPage('app-messages #clearBtn');
    await browser.sleep(1000);

    /* the dashboard page is now shown - following auth0 redirection */
    const dashboardPage = getDashboardPage();
    expect(await dashboardPage.rootElements.logoutBtn.isDisplayed())
      .toBeTruthy();

    /* Note: It appears you can only re-enable this after all tests - otherwise tests time out. I don't know why I can't re-enable for the Angular pages. */
    await browser.waitForAngularEnabled(true);
  };

  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  /* set long timeout to allow for debug */
  const setTimeout = (timeout = 1200000) => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  }

  const resetTimeout = (original: number) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = original;
  }

  let logs = {} as browserLogs.BrowserLogs;

  const setupLogsMonitor = async () => {
    /* you must clear the browser logs before each test */
    await browser.manage().logs().get('browser');
    const logs = browserLogs(browser);
    // /* ignore debug and info log messages */
    // logs.ignore(logs.DEBUG);
    // logs.ignore(logs.INFO);
    /* ignore favicon errors e.g. from auth0 site */
    logs.ignore(/favicon/);
    return logs;
  };

  const checkLogs = async (logs: browserLogs.BrowserLogs) => {
    /* use browser.wait to allow the browser return any logs that are to be tested - use await log.verify as it returns a promise */
    await browser.wait(async () => {
      try {
        await logs.verify();
        return true;
      } catch (e) {
        return false
      };
    }, 5000, 'Logs test fail');
  };

  return {
    awaitPage,
    loadRootPage,
    createExpected,
    login,
    originalTimeout,
    setTimeout,
    resetTimeout,
    resetDatabase,
    logs,
    setupLogsMonitor,
    checkLogs,
  }
}
