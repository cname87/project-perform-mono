/**
 * This module tests authentication functionality i.e. login and logout.
 * It also tests the profile page.
 */

import { browser, by, ExpectedConditions, element } from 'protractor';
import browserLogs from 'protractor-browser-logs';

import { getLoginPage } from './pages/login.page';
import { getDashboardPage } from './pages/dashboard.page';
import { resetDatabase} from '../../utils/reset-testDatabase';
import { getUserProfilePage } from './pages/user-profile.page';

describe('Authentication:', () => {

  /* holds browser logs utility */
  let logs: browserLogs.BrowserLogs;
  /* set timeout here - loaded in beforeAll below */
  const timeout = 120000;
  let originalTimeout: number;

  /* awaits for an element with the css selector to be visible on the page */
  const awaitPage = async (css = 'app-root') => {
    const testPromise = (css = 'app-root') => {
      const EC = ExpectedConditions;
      return EC.visibilityOf(element(by.css(css)));
    }
    await browser.wait(testPromise(css), 5000);
  };

  const loadRootPage = async (css: string) => {
    await browser.get('/');
    await awaitPage(css);
  };

  const createExpected = () => {
    return {
      bannerHeader: 'Team Members',
      informationHeader: 'LOG IN',
      informationHint: 'Click on the Log In button above',
      profileName: 'seany',
      profileEmail: 'sean.young@openet.com',
      profilePassword: 'perforM#1',
    };
  };

  beforeAll(async () => {
    /* test that test database is in use and reset it, loading mock members */
    await resetDatabase();
    /* set timeout to allow for debug */
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;

  });

  afterAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  beforeEach(async () => {
    /* clear browser logs before test */
    browser.manage().logs().get('browser');
    logs = browserLogs(browser);
    /* ignore debug and info log messages */
    logs.ignore(logs.DEBUG);
    logs.ignore(logs.INFO);
    /* ignore favicon errors from auth0 site */
    logs.ignore(/favicon/);

  });

  afterEach(async () => {
    await browser.waitForAngularEnabled(false);
    /* will fail the test on logs.ERROR or higher */
    return logs.verify();
  });

  describe('If not authenticated shows a login page', () => {

    beforeAll(async () => {
      await loadRootPage('#loginBtn');
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
      const { profileEmail, profilePassword } = createExpected();

      /* the login page is still shown */
      const loginPage = getLoginPage();

      await loginPage.rootElements.loginBtn.click();

      /* log-in on the non-angular auth0 page using the selenium webdriver */
      const nameInput = await browser.driver.findElement(by.name('username'));
      await nameInput.sendKeys(profileEmail);
      const passwordInput = browser.driver.findElement(by.name('password'));
      await passwordInput.sendKeys(profilePassword);
      const continueButton = browser.driver.findElement(by.css('.ulp-button'));
      await continueButton.click();

      /* disable wait for angular (as auth0 has redirected and therefore the page is not seen as an angular page?) */
      await browser.waitForAngularEnabled(false);

      /* await until the dashboard logout button is present */
      await awaitPage('#logoutBtn');

      /* the dashboard page is now shown - following auth0 redirection */
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.rootElements.logoutBtn.isDisplayed())
        .toBeTruthy();

      /* Note: You can only re-enable this after all tests - otherwise tests time out.  Tests appear to work in the next it test with it enabled. */
      await browser.waitForAngularEnabled(true);
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
      const { profileName, profileEmail } = createExpected();

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
        .toEqual('NAME: ' + profileName );
      expect(await profilePage.userProfileElements.profileEmail.getText())
        .toEqual('EMAIL: ' + profileEmail );
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
