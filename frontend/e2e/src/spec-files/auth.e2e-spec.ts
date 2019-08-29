/**
 * This module tests authentication functionality i.e. login and logout.
 * It also tests the profile page.
 */

// import { browser, by, ExpectedConditions, element } from 'protractor';
import browserLogs from 'protractor-browser-logs';

import { getLoginPage } from '../pages/login.page';
import { getDashboardPage } from '../pages/dashboard.page';
// import { resetDatabase} from '../../../utils/reset-testDatabase';
import { getUserProfilePage } from '../pages/user-profile.page';
import { getHelpers } from '../e2e-helpers';

describe('Authentication:', () => {

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

  beforeAll(async () => {
    /* test that test database is in use and reset it */
    // await resetDatabase();
    setTimeout();
  });

  afterAll(() => {
    resetTimeout(originalTimeout);
  });

  const createExpected = () => {
    return {
      bannerHeader: 'Team Members',
      informationHeader: 'LOG IN',
      informationHint: 'Click on the Log In button above',
    };
  };

  describe('If not authenticated shows a login page', () => {

    let logs = {} as browserLogs.BrowserLogs;

    beforeAll(async () => {
      await loadRootPage('#loginBtn');
    });

    beforeEach(async () => {
      logs = await setupLogsMonitor();
    });

    afterEach(async () => {
      await checkLogs(logs);
    });

    it(`with a banner containing a login button only`, async () => {
      const { bannerHeader } = createExpected();
      let loginPage = getLoginPage();
      expect(await loginPage.rootElements.bannerHeader.getText())
        .toEqual(bannerHeader);
      expect(await loginPage.rootElements.loginBtn.isDisplayed())
        .toBeTruthy();
      expect(await loginPage.rootElements.logoutBtn.isPresent())
        .not.toBeTruthy();
      expect(await loginPage.rootElements.profileBtn.isPresent())
        .not.toBeTruthy();
    });

    it(`with a nav bar with all links disabled`, async () => {
      let loginPage = getLoginPage();
      expect(await loginPage.rootElements.dashboardLink
        .getAttribute('ng-reflect-active')
      ).toEqual('false');
      expect(await loginPage.rootElements.membersLink
        .getAttribute('ng-reflect-active')
      ).toEqual('false');
      expect(await loginPage.rootElements.detailLink
        .getAttribute('ng-reflect-active')
      ).toEqual('false');
    });

    it(`with a nav bar with all links disabled`, async () => {
      let loginPage = getLoginPage();
      expect(await loginPage.rootElements.dashboardLink
        .getAttribute('ng-reflect-active')
      ).toEqual('false');
      expect(await loginPage.rootElements.membersLink
        .getAttribute('ng-reflect-active')
      ).toEqual('false');
      expect(await loginPage.rootElements.detailLink
        .getAttribute('ng-reflect-active')
      ).toEqual('false');
    });

    it(`with a information element`, async () => {
      const { informationHeader, informationHint } = createExpected();
      let loginPage = getLoginPage();
      expect(await loginPage.loginInformationElement.header.getText())
        .toEqual(informationHeader);
      expect(await loginPage.loginInformationElement.hint.getText())
        .toEqual(informationHint);
    });

    it(`with an empty messages element`, async () => {
      let loginPage = getLoginPage();
      expect(await loginPage.rootElements.messagesHeader.isPresent())
        .not.toBeTruthy();
    });

  });

  describe('You can log in', () => {

    beforeAll(async () => {
      await loadRootPage('#loginBtn');
    });

    it(`by clicking on the login button`, async () => {
     await login();
    });

    it(`and the profile button will be visible`, async () => {
      /* the dashboard page is still shown */
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.rootElements.profileBtn.isDisplayed())
        .toBeTruthy();
    });

  });

  describe('You can get the user profile', () => {

    beforeAll(async () => {
      await loadRootPage('#logoutBtn');
    });

    it(`by clicking on the profile button`, async () => {

      /* dashboard page is initially displayed */
      const dashboardPage = getDashboardPage();

      await dashboardPage.rootElements.profileBtn.click();
      await awaitPage('#goBackBtn');

      /* profile page is now displayed */
      const profilePage = getUserProfilePage();
      expect(await profilePage.rootElements.logoutBtn.isDisplayed())
        .toBeTruthy();
      expect(await profilePage.userProfileElements.profileName.isDisplayed())
        .toBeTruthy();
      expect(await profilePage.userProfileElements.profileName.getText())
        .toEqual('NAME: ' + process.env.TEST_NAME );
      expect(await profilePage.userProfileElements.profileEmail.getText())
        .toEqual('EMAIL: ' + process.env.TEST_EMAIL );
    });

    it(`and then click go back to return`, async () => {

      /* profile page is still displayed */
      const profilePage = getUserProfilePage();

      await profilePage.userProfileElements.goBackBtn.click();
      await awaitPage('#logoutBtn');

      /* dashboard page is initially displayed */
      const dashboardPage = getDashboardPage();

      expect(await dashboardPage.rootElements.logoutBtn.isDisplayed())
        .toBeTruthy();
      expect(await dashboardPage.dashboardElements.topMembers.isDisplayed())
        .toBeTruthy();

    });

  });

  describe('You can log out', () => {

    beforeAll(async () => {
      await loadRootPage('#logoutBtn');
    });

    it(`by clicking on the logout button`, async () => {
      const { informationHeader } = createExpected();

      /* dashboard page is initially displayed */
      const dashboardPage = getDashboardPage();

      await dashboardPage.rootElements.logoutBtn.click();
      await awaitPage('#loginBtn');

      /* the login page is now displayed */
      let loginPage = getLoginPage();

      expect(await loginPage.rootElements.loginBtn.isDisplayed())
        .toBeTruthy();
      expect(await loginPage.loginInformationElement.header.getText())
        .toEqual(informationHeader);
    });

  });

});
