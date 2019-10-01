/**
 * This module tests authentication functionality i.e. login and logout.
 * It also tests the profile page.
 */
import { browser } from 'protractor';

import { getLoginPage } from '../pages/login.page';
import { getDashboardPage } from '../pages/dashboard.page';
import { getUserProfilePage } from '../pages/user-profile.page';
import { getHelpers } from '../e2e-helpers';
import { getRootElements } from '../pages/elements/root.elements';

describe('Authentication:', () => {
  const {
    awaitElementVisible,
    login,
    originalTimeout,
    setTimeout,
    resetTimeout,
    resetDatabase,
  } = getHelpers();

  const createExpected = () => {
    return {
      bannerHeader: 'Team Members',
      informationHeader: 'LOG IN',
      informationHint: 'Click on the Log In button above',
    };
  };

  /* Note: app must start in logged in state */

  beforeAll(async () => {
    /* test that test database is in use and reset it */
    await resetDatabase();
    setTimeout(120000);
  });

  afterAll(() => {
    resetTimeout(originalTimeout);
  });

  /* need to log out first */
  describe('You can log out', () => {
    /* the app must be logged in at this point */
    beforeAll(async () => {
      await awaitElementVisible(getRootElements().logoutBtn);
    });

    it(`by clicking on the logout button`, async () => {
      const { informationHeader } = createExpected();

      /* dashboard page is initially displayed */
      const dashboardPage = getDashboardPage();

      await dashboardPage.rootElements.logoutBtn.click();

      /* the login page is now displayed */
      let loginPage = getLoginPage();

      /* test visibility to ensure page shown */
      await awaitElementVisible(loginPage.rootElements.loginBtn);

      await browser.wait(async () => {
        return (
          (await loginPage.loginInformationElement.header.getText()) ===
          informationHeader
        );
      });
    });
  });

  describe('If not authenticated shows a login page', () => {
    /* the app must be logged out at this stage */
    beforeAll(async () => {
      await awaitElementVisible(getRootElements().loginBtn);
    });

    it(`with a banner containing a login button only`, async () => {
      const { bannerHeader } = createExpected();
      let loginPage = getLoginPage();
      expect(await loginPage.rootElements.bannerHeader.getText()).toEqual(
        bannerHeader,
      );
      expect(await loginPage.rootElements.loginBtn.isDisplayed()).toBeTruthy();
      expect(
        await loginPage.rootElements.logoutBtn.isPresent(),
      ).not.toBeTruthy();
      expect(
        await loginPage.rootElements.profileBtn.isPresent(),
      ).not.toBeTruthy();
    });

    it(`with a nav bar with all links disabled`, async () => {
      let loginPage = getLoginPage();
      expect(
        await loginPage.rootElements.dashboardLink.getAttribute(
          'aria-disabled',
        ),
      ).toEqual('true');
      expect(
        await loginPage.rootElements.membersLink.getAttribute('aria-disabled'),
      ).toEqual('true');
      expect(
        await loginPage.rootElements.detailLink.getAttribute('aria-disabled'),
      ).toEqual('true');
    });

    it(`with a information element`, async () => {
      const { informationHeader, informationHint } = createExpected();
      let loginPage = getLoginPage();
      expect(await loginPage.loginInformationElement.header.getText()).toEqual(
        informationHeader,
      );
      expect(await loginPage.loginInformationElement.hint.getText()).toEqual(
        informationHint,
      );
    });

    it(`with an empty messages element`, async () => {
      let loginPage = getLoginPage();
      expect(
        await loginPage.rootElements.messagesHeader.isPresent(),
      ).not.toBeTruthy();
    });
  });

  describe('You can log in', () => {
    /* the app must be logged out at this stage */
    beforeAll(async () => {
      await awaitElementVisible(getRootElements().loginBtn);
    });

    it(`by clicking on the login button`, async () => {
      await login();
      await awaitElementVisible(getRootElements().logoutBtn);
    });

    it(`and the profile button will be visible`, async () => {
      /* the dashboard page is shown */
      const dashboardPage = getDashboardPage();
      expect(
        await dashboardPage.rootElements.profileBtn.isDisplayed(),
      ).toBeTruthy();
    });
  });

  describe('You can get the user profile', () => {
    /* the app must be logged in at this stage */
    beforeAll(async () => {
      await awaitElementVisible(getRootElements().logoutBtn);
    });

    it(`by clicking on the profile button`, async () => {
      /* dashboard page is initially displayed */
      const dashboardPage = getDashboardPage();

      await dashboardPage.rootElements.profileBtn.click();

      /* profile page is now displayed */
      const profilePage = getUserProfilePage();

      /* wait for visibility before test */
      await awaitElementVisible(profilePage.userProfileElements.goBackBtn);

      await browser.wait(async () => {
        return profilePage.userProfileElements.profileName.isDisplayed();
      });

      expect(
        await profilePage.userProfileElements.profileName.getText(),
      ).toEqual('NAME: ' + process.env.TEST_NAME);
      expect(
        await profilePage.userProfileElements.profileEmail.getText(),
      ).toEqual('EMAIL: ' + process.env.TEST_EMAIL);
    });

    it(`and then click go back to return`, async () => {
      /* profile page is still displayed */
      const profilePage = getUserProfilePage();

      await profilePage.userProfileElements.goBackBtn.click();

      /* dashboard page is initially displayed */
      const dashboardPage = getDashboardPage();

      /* wait for visibility before test */
      await awaitElementVisible(dashboardPage.memberSearchElement.searchBox);

      expect(
        await dashboardPage.dashboardElements.topMembers.isDisplayed(),
      ).toBeTruthy();
    });
  });
});
