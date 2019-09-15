const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { browser } from 'protractor';
import browserLogs from 'protractor-browser-logs';

import { getRootElements } from './pages/elements/root.elements';
import { getMembersListPage } from './pages/membersList.page';

/**
 * This module provides a function that returns common helper functions.
 */

export const getHelpers = () => {

  const resetDatabase = require('../onPrepare').resetDatabase;

  const awaitElementVisible = require('../onPrepare').awaitElementVisible;

  const loadRootPage = require('../onPrepare').loadRootPage;

  const login = require('../onPrepare').login;

  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  const setTimeout = require('../onPrepare').setTimeout;

  const resetTimeout = (original: number) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = original;
  }

  /* set up the logs monitor to allow logs be tested against */
  const setupLogsMonitor = async (ignoreLogs = true) => {
    /* you must clear the browser logs before each test */
    await browser.manage().logs().get('browser');
    const logs = browserLogs(browser);
    /* ignore debug and info log messages */
    if (ignoreLogs) {
      logs.ignore(logs.DEBUG);
      logs.ignore(logs.INFO);
    }
    /* ignore favicon errors e.g. from auth0 site */
    logs.ignore(/favicon/);
    return logs;
  };

  /* get the browser logs for testing */
  const checkLogs = async (logs: browserLogs.BrowserLogs) => {
    /* use browser.wait to allow the browser return any logs that are to be tested - use await log.verify as it returns a promise (not void) */
    await browser.wait(async () => {
      try {
        await logs.verify();
        await browser.driver.sleep(100);
        return true;
      } catch (e) {
        return false
      };
    }, 5000, 'Logs test fail');
  };

    /**
   * Clears the messages list and waist until zero messages shown.
   * If the message clear button is not shown it will do nothing.
   */
  const clearMessages = async () => {
    await awaitElementVisible(getRootElements().messagesClearBtn);
    await getRootElements().messagesClearBtn.click();
    /* wait until zero messages displayed */
    await browser.wait(async () => {
      return (
        await getRootElements().messages.count()
        === 0
      );
    }, 5000);
  }


  const clearCache = async () => {
    await browser.executeScript('window.sessionStorage.clear();');
    await browser.executeScript('window.localStorage.clear();');
  }

    /**
   * Assumes the dashboard page is being displayed.
   * Clicks on the members link.
   * The members list page is loaded.
   * @param numberExpected: The expected number of members that will be displayed - defaults to 10.
   */
  async function getMembersList(numberExpected = 10) {

    /* click on members nav link */
    await getRootElements().membersLink.click();

    /* the members list page should be displayed */
    const membersListPage = getMembersListPage();

    /* await visibility of an element */
    await awaitElementVisible(membersListPage.memberListElements.tag);
    /* wait until full count of members list is displayed */
    await browser.wait(async () => {
      return (
        await membersListPage.memberListElements.allMemberIds.count()
          === numberExpected
      );
    });
  }

  return {
    resetDatabase,
    awaitElementVisible,
    loadRootPage,
    login,
    originalTimeout,
    setTimeout,
    resetTimeout,
    setupLogsMonitor,
    checkLogs,
    clearMessages,
    clearCache,
    getMembersList,
  }
}
