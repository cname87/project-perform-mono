/* eslint-disable @typescript-eslint/no-var-requires */
import { browser } from 'protractor';
import browserLogs from 'protractor-browser-logs';

import { getRootElements } from '../pages/elements/root.elements';
import { getMembersListPage } from '../pages/membersList.page';
import { getDashboardPage } from '../pages/dashboard.page';
import { getMemberDetailPage } from '../pages/memberDetail.page';

/**
 * This module provides a function that returns common helper functions.
 */

export const getHelpers = () => {
  const onPreparePath = '../config/onPrepare';
  const { mockMembers } = require(onPreparePath);
  const { resetDatabase } = require(onPreparePath);
  const { awaitElementVisible } = require(onPreparePath);
  const { awaitElementInvisible } = require(onPreparePath);
  const { loadRootPage } = require(onPreparePath);
  const { login } = require(onPreparePath);
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  const { setTimeout } = require(onPreparePath);
  const resetTimeout = (original: number) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = original;
  };

  /* set up the logs monitor to allow logs be tested against */
  const setupLogsMonitor = async (ignoreLogs = true) => {
    /* you must clear the browser logs before each test */
    await browser.manage().logs().get('browser');

    /**
     * TODO remove any when protractor-browser-logs is updated
     * protractor-browser-logs uses protractor 5.4.3 and the protractor version is 5.4.4 and there is a type incompatibility.
     */
    // const browserVar: ProtractorBrowser = browser;
    const browserVar: any = browser;

    const logs = browserLogs(browserVar);
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
    await browser.wait(
      async () => {
        try {
          await logs.verify();
          await browser.driver.sleep(100);
          return true;
        } catch (e) {
          return false;
        }
      },
      5000,
      'Logs test fail',
    );
  };

  /**
   * Clears the messages list and waist until zero messages shown.
   * If the message clear button is not shown it will do nothing.
   */
  const clearMessages = async () => {
    await awaitElementVisible(getRootElements().messagesClearBtn);
    await getRootElements().messagesClearBtn.click();
    /* wait until zero messages displayed */
    await browser.wait(
      async () => (await getRootElements().messages.count()) === 0,
      5000,
    );
  };

  const clearCache = async () => {
    await browser.executeScript('window.sessionStorage.clear();');
    await browser.executeScript('window.localStorage.clear();');
  };

  /**
   * Clicks on the members link on the nav bar.
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

    /* test resolver prevents the page loading until data is available by testing for the full count of members list without browser.wait */
    expect(
      await membersListPage.memberListElements.allMemberIds.count(),
    ).toEqual(numberExpected);

    /* await the disappearance of the progress bar */
    await awaitElementInvisible(getRootElements().progressBar);
  }

  /**
   * Clicks on the dashboard link on the nav bar.
   * The dashboard page is loaded.
   * @param numberExpected: The expected number of top members that will be displayed - defaults to 4.
   */
  async function getDashboard(numberExpected = 4) {
    /* click on members nav link */
    await getRootElements().dashboardLink.click();

    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();

    /* await visibility of an element */
    await awaitElementVisible(dashboardPage.dashboardElements.tag);

    /* test resolver prevents the page loading until data is available by testing for the members presence without browser.wait */
    expect(await dashboardPage.dashboardElements.topMembers.count()).toEqual(
      numberExpected,
    );
  }

  /**
   * Assumes the dashboard page is being displayed.
   * Selects a member from the top members dashboard based on a passed-in index.
   * The appropriate member detail page is loaded.
   * @param index: Index is zero-based and must correspond to a displayed member, i.e. if 2 is passed in then at least three members must be displayed (and the third member is selected).
   */
  const dashboardClickMember = async (index: number) => {
    const dashboardPage = getDashboardPage();

    /* get member link and name */
    const { name, link } = await dashboardPage.dashboardElements.selectMember(
      index,
    );

    /* click on the selected member which brings up the member detail page */
    await link.click();

    /* await the appearance of the progress bar as should be loading from the database server */
    await awaitElementVisible(getRootElements().progressBar);

    /* the members detail page should be displayed */
    const memberDetailPage = getMemberDetailPage();

    /* await until element visible */
    await awaitElementVisible(memberDetailPage.memberDetailElements.tag);

    /* test resolver prevents the page loading until data is available by testing for the member name without browser.wait */
    expect(
      (await memberDetailPage.memberDetailElements.getMember()).name,
    ).toEqual(name);

    /* await the disappearance of the progress bar */
    await awaitElementInvisible(getRootElements().progressBar);
  };

  return {
    mockMembers,
    resetDatabase,
    awaitElementVisible,
    awaitElementInvisible,
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
    getDashboard,
    dashboardClickMember,
  };
};
