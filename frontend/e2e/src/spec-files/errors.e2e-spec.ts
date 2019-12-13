/**
 * This module tests error handling functionality.
 *
 * The e2e build environment must be in use, (i.e. the application built with ng build --configuration e2eTest), so environment.e2eTesting is true.  This environment variable is used is a http interceptor to simulate various errors tested below.
 */

import { browser, ExpectedConditions } from 'protractor';

import { getDashboardPage } from '../pages/dashboard.page';
import { getMemberDetailPage } from '../pages/memberDetail.page';
import { getMembersListPage } from '../pages/membersList.page';
import { getErrorInformationPage } from '../pages/error-information.page';
import { getHelpers } from '../helpers/e2e-helpers';

/* dummy member for e2e error testing - must match the value in config.ts */
/* can't easily import config.ts as would need to mock global window variable and also import 'zone...' in environment import causes a problem */
export const errorMember = {
  id: 10,
  name: 'errorName',
};

describe('Error Handling', () => {
  const {
    awaitElementVisible,
    loadRootPage,
    originalTimeout,
    setTimeout,
    resetTimeout,
    resetDatabase,
    setupLogsMonitor,
    checkLogs,
    clearMessages,
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

  /* run before each 'it' function to supply local variables e.g. expected values for tests */
  const createExpected = () => {
    return {
      numMembers: 10, // resetDatbase loads 10 members
    };
  };

  describe('handles server request errors:', () => {
    beforeAll(async () => {
      await loadRootPage();
    });

    it(`GET /members?name='error' causes an unexpected error`, async () => {
      /* set up to test that an error is logged */
      const logs = await setupLogsMonitor();
      logs.expect(/Test unexpected error/, logs.ERROR);

      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();

      /* clear messages list */
      await clearMessages();

      /* enter dummy text in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('error');

      /* wait until new message appears */
      await browser.wait(async () => {
        return (await dashboardPage.rootElements.messages.count()) === 1;
      });

      /* check new message logged on screen */
      const message = await dashboardPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(
        'MembersService: ERROR: Failed to get members from server',
      );

      /* wait until toastr is displayed */
      await browser.wait(dashboardPage.rootElements.toastr.isDisplayed(), 5000);

      /* check toastr message */
      expect(await dashboardPage.rootElements.toastrTitle.getText()).toBe(
        'A server access error has occurred',
      );
      expect(await dashboardPage.rootElements.toastrMessage.getText()).toBe(
        'ERROR!',
      );

      /* check logs report an error */
      await checkLogs(logs);
    });

    it('DELETE /members/10 causes an unexpected error', async () => {
      /* get expected values object */
      const { numMembers } = createExpected();

      /* set up to test that an error is logged */
      const logs = await setupLogsMonitor();
      logs.expect(/Test unexpected error/, logs.ERROR);

      /* the dashboard should be displayed - click on members list link and pass in number of members expected */
      await getMembersList(numMembers);

      /* the members list page should be displayed */
      let membersListPage = getMembersListPage();

      /* clear messages list */
      await clearMessages();

      /* click DELETE members/10 => error */
      const {
        deleteButton,
      } = membersListPage.memberListElements.selectMemberById(errorMember.id);
      await deleteButton.click();

      /* wait until new message appears */
      await browser.wait(async () => {
        return (await membersListPage.rootElements.messages.count()) === 1;
      });

      /* check message logged on screen */
      const message = await membersListPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(
        'MembersService: ERROR: Failed to delete member from server',
      );

      /* wait until toastr is displayed */
      await browser.wait(
        membersListPage.rootElements.toastr.isDisplayed(),
        5000,
      );

      /* check toastr message */
      expect(await membersListPage.rootElements.toastrTitle.getText()).toBe(
        'A server access error has occurred',
      );
      expect(await membersListPage.rootElements.toastrMessage.getText()).toBe(
        'ERROR!',
      );

      /* check logs report an error */
      await checkLogs(logs);
    });

    it(`POST /members causes a server-side  error`, async () => {
      /* set up to test that an error is logged */
      const logs = await setupLogsMonitor();
      logs.expect(/Test server-side error/, logs.ERROR);

      /* the member list page is still displayed */
      let membersListPage = getMembersListPage();

      /* clear messages list */
      await clearMessages();

      /* enter new name in input box */
      await membersListPage.memberInputElements.inputBox.sendKeys(
        errorMember.name,
      );
      /* click on add which saves member and stays on members view */
      await membersListPage.memberInputElements.actionBtn.click();

      /* wait until the new message appears */
      await browser.wait(async () => {
        return (await membersListPage.rootElements.messages.count()) === 1;
      }, 5000);

      /* check message logged on screen */
      const message = await membersListPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(
        'MembersService: ERROR: Failed to add member to server',
      );

      /* test that an error is logged */
      await checkLogs(logs);
    });

    it('GET /members/10 causes a HttpClient error', async () => {
      /* get expected values object */
      const { numMembers } = createExpected();

      /* set up to test that an error is logged */
      const logs = await setupLogsMonitor();
      /* isTrusted = false is hiding the original error object from being displayed- see https://stackoverflow.com/questions/44815172/log-shows-error-object-istrustedtrue-instead-of-actual-error-data so I'm just looking for the statusText */
      logs.expect(/Test 999 error/, logs.ERROR);

      /* click on members list link and pass in number of members expected */
      await getMembersList(numMembers);

      /* the members list page should be displayed */
      const membersListPage = getMembersListPage();

      /* clear messages list */
      await clearMessages();

      /* get the link of the member */
      const {
        memberName,
      } = membersListPage.memberListElements.selectMemberById(errorMember.id);

      /* click on the member which will trigger an error */
      await memberName.click();

      /* wait until new message appears */
      await browser.wait(async () => {
        return (await membersListPage.rootElements.messages.count()) === 1;
      }, 5000);

      /* check message logged on screen */
      const message = await membersListPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(
        'MembersService: ERROR: Failed to get member from server',
      );

      /* check logs report an error */
      await checkLogs(logs);
    });

    it('PUT /members causes a server-side error', async () => {
      /* get expected values object */
      const { numMembers } = createExpected();

      /* set up to test that an error is logged */
      const logs = await setupLogsMonitor();
      logs.expect(/Test server-side error/, logs.ERROR);

      /* click on members list link and pass in number of members expected */
      await getMembersList(numMembers);

      /* the members list page should be displayed */
      const membersPage = getMembersListPage();

      /* wait and get the link of the member 9 */
      const { memberName } = await browser.wait(async () => {
        return membersPage.memberListElements.selectMemberById(9);
      });
      /* click on the member which takes us to the member detail view */
      await memberName.click();

      /* get the member detail page elements */
      const memberDetailPage = getMemberDetailPage();

      /* test for visibility of members detail element tag */
      await awaitElementVisible(memberDetailPage.memberDetailElements.tag);

      /* confirm you have member 9 */
      await browser.wait(async () => {
        return (
          (await memberDetailPage.memberDetailElements.getMember()).id === 9
        );
      }, 5000);

      /* clear messages list */
      await clearMessages();

      /* set the name to the errorMember name in the input field */
      await memberDetailPage.memberInputElements.inputBox.clear();
      await memberDetailPage.memberInputElements.inputBox.sendKeys(
        errorMember.name,
      );

      /* generate a PUT app-v1/members => an error */
      await memberDetailPage.memberInputElements.actionBtn.click();

      /* wait until new message appears */
      await browser.wait(async () => {
        return (await memberDetailPage.rootElements.messages.count()) === 1;
      });

      /* check message logged on screen */
      const message = await memberDetailPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(
        'MembersService: ERROR: Failed to update member on the server',
      );

      /* check logs report an error */
      await checkLogs(logs);
    });
  });

  describe('handles application exceptions:', () => {
    beforeAll(async () => {
      await loadRootPage();
    });

    it('Unexpected application error', async () => {
      /* set up to test that an error is logged */
      const logs = await setupLogsMonitor();
      logs.expect(/Test application error/, logs.ERROR);

      /* the dashboard page should be displayed */
      let dashboardPage = getDashboardPage();

      /* clear messages list */
      await clearMessages();

      /* enter dummy name in search box - triggers application error*/
      await dashboardPage.memberSearchElement.searchBox.sendKeys(
        'errorSearchTerm',
      );

      /* the error information page is displayed */
      const pageErrorInformationPage = getErrorInformationPage();

      /* wait until information card title is displayed */
      await awaitElementVisible(
        pageErrorInformationPage.errorInformationElements.header,
      );

      /* wait the header and hint text */
      await browser.wait(async () => {
        return (
          (await pageErrorInformationPage.errorInformationElements.header.getText()) ===
          'UNEXPECTED ERROR!'
        );
      }, 5000);
      await browser.wait(async () => {
        return (
          (await pageErrorInformationPage.errorInformationElements.hint.getText()) ===
          'Click on a tab link above'
        );
      }, 5000);

      /* wait until new message appears */
      await browser.wait(async () => {
        return (
          (await pageErrorInformationPage.rootElements.messages.count()) === 1
        );
      }, 5000);

      /* check message logged on screen */
      const message = await pageErrorInformationPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(
        'ErrorHandlerService: ERROR: An unknown error occurred',
      );

      /* wait until toastr is displayed */
      await browser.wait(
        pageErrorInformationPage.rootElements.toastr.isDisplayed(),
        5000,
      );

      /* check toastr message */
      expect(
        await pageErrorInformationPage.toastrElement.toastrTitle.getText(),
      ).toBe('An unknown error has occurred');
      expect(
        await pageErrorInformationPage.rootElements.toastrMessage.getText(),
      ).toBe('ERROR!');

      /* check toastr disappears after timeout */
      var EC = ExpectedConditions;
      await browser.wait(
        EC.invisibilityOf(pageErrorInformationPage.toastrElement.toastr),
        6000,
      );
      expect(
        await pageErrorInformationPage.toastrElement.toastr.isDisplayed(),
      ).toBe(false);

      /* check logs report an error */
      await checkLogs(logs);
    });
  });
});
