/**
 * This module tests error handling functionality.
 */

import { browser, ExpectedConditions } from 'protractor';

// import { resetDatabase} from '../../../utils/reset-testDatabase';
import { getDashboardPage } from '../pages/dashboard.page';
import { getMemberDetailPage } from '../pages/memberDetail.page';
import { getMembersListPage } from '../pages/membersList.page';
import { getErrorInformationPage } from '../pages/error-information.page';
import { getHelpers } from '../e2e-helpers';
/* need to set a dummy client-side window global as it is referenced in auth0 configuration in config.ts */
global['window'] = {
  location: {
    origin: 'dummy',
  },
};
import { errorMember } from '../../../src/app/config';

fdescribe('Error Handling', () => {

  const {
    // awaitPage,
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

  /* run before each 'it' function to supply local variables e.g. expected values for tests */
  const testSetup = () => {
    const expected = {
      numMembers: 10, // resetDatbase below loads 10 members
    };
    return {
      expected,
    };
  };

  /**
   * Assumes the dashboard page is being displayed.
   * Clicks on the members link.
   * The members list page is loaded.
   * @param numberExpected: The expected number of members that will be displayed.
   */
  async function getMembersList(numberExpected: number) {
    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();
    /* click on members nav link */
    await dashboardPage.rootElements.membersLink.click();
    /* the members list page should be displayed */
    const membersListPage = getMembersListPage();
    expect(await membersListPage.memberListElements.tag.isPresent()).toBeTruthy(
      'shows member list',
    );

    /* confirm count of members displayed */
    expect(
      await membersListPage.memberListElements.allMemberIds.count(),
    ).toEqual(numberExpected, 'number of members');
  }

  describe('handles server request errors:', () => {

    beforeAll(async() => {
      loadRootPage('#search-box');
      await browser.sleep(1000);
    });

    fit(`GET /members?name='error' causes an unexpected error`, async () => {

      const logs = await setupLogsMonitor();
      /* test an error is logged */
      logs.expect(/Test unexpected error/, logs.ERROR);

      /* the dashboard page should be displayed */
      let dashboardPage = getDashboardPage();
      /* enter dummy text in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('error');
      await browser.sleep(1000);
      /* check message logged on screen */
      dashboardPage = getDashboardPage();
      const count = await dashboardPage.rootElements.messages.count();
      const message = await dashboardPage.rootElements.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to get members from server');
      /* check toastr is displayed */
      expect(
        await dashboardPage.rootElements.toastr
          .isDisplayed(),
      ).toBe(true);
      expect(
        await dashboardPage.rootElements.toastrTitle
          .getText(),
      ).toBe('A server access error has occurred');
      expect(
        await dashboardPage.rootElements.toastrMessage
          .getText(),
      ).toBe('ERROR!');

      await checkLogs(logs);
    });

    it('DELETE /members/10 causes an unexpected error', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      const logs = await setupLogsMonitor();
      /* test an error is logged */
      logs.expect(/Test unexpected error/, logs.ERROR);

      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
      /* the members list page should be displayed */
      let membersListPage = getMembersListPage();
      /* get the link of the member 9 without error */
      const {
        deleteButton,
      } = await membersListPage.memberListElements.selectMemberById(
        errorMember.id,
      );
      /* generates DELETE members/10 => error */
      await deleteButton.click();
      /* check message logged on screen */
      membersListPage = getMembersListPage();
      const count = await membersListPage.rootElements.messages.count();
      const message = await membersListPage.rootElements.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to delete member from server');
      /* check toastr is displayed */
      expect(
        await membersListPage.rootElements.toastr
          .isDisplayed(),
      ).toBe(true);
      expect(
        await membersListPage.rootElements.toastrTitle
          .getText(),
      ).toBe('A server access error has occurred');
      expect(
        await membersListPage.rootElements.toastrMessage
          .getText(),
            ).toBe('ERROR!');

      await checkLogs(logs);
    });

    it(`POST /members causes a server-side  error`, async () => {

      const logs = await setupLogsMonitor();
      /* test that an error is logged */
      logs.expect(/Http client-side/, logs.ERROR);

      /* the member detail page is still displayed */
      let membersListPage = getMembersListPage();
      /* get the list of members */
      /* enter new name in input box */
      await membersListPage.memberInputElements.inputBox.sendKeys(
        errorMember.name,
      );
      /* click on add which saves member and stays on members view */
      await membersListPage.memberInputElements.actionBtn.click();
      membersListPage = getMembersListPage();
      /* check message logged on screen */
      membersListPage = getMembersListPage();
      const count = await membersListPage.rootElements.messages.count();
      const message = await membersListPage.rootElements.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to add member to server');
      /* test that an error is logged */
      logs.expect(/Test server-side error/, logs.ERROR);
    });

    it('GET /members/10 causes a HttpClient error', async () => {
      /* get expected values object */
      const { expected } = testSetup();

      const logs = await setupLogsMonitor();
      /* test that an error is logged */
      logs.expect(/Http client-side/, logs.ERROR);

      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
      /* the members list page should be displayed */
      let membersListPage = getMembersListPage();
      /* get the link of the member 9 without error */
      const {
        memberName,
      } = await membersListPage.memberListElements.selectMemberById(
        errorMember.id,
      );
      /* click on the member which takes us to the member detail view */
      await memberName.click();
      /* check message logged on screen */
      membersListPage = getMembersListPage();
      const count = await membersListPage.rootElements.messages.count();
      const message = await membersListPage.rootElements.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to get member from server');

    });

    it('PUT /members causes a server-side error', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* click on members list link and pass in number of members expected */

      const logs = await setupLogsMonitor();
      /* test that an error is logged */
      logs.expect(/Test server-side error/, logs.ERROR);

      await getMembersList(expected.numMembers);
      /* the members list page should be displayed */
      const membersPage = getMembersListPage();
      /* get the link of the member 9 without error */
      const {
        memberName,
      } = await membersPage.memberListElements.selectMemberById(
        9,
      );
      /* click on the member which takes us to the member detail view */
      await memberName.click();
      let memberDetailPage = getMemberDetailPage();
      /* get the member from the member detail page */
      const member = await memberDetailPage.memberDetailElement.getMember();
      /* confirm you have member 9 */
      expect(member.id).toEqual(9, 'member 9 selected');
      /* set the name to the errorMember name in the input field */
      await memberDetailPage.memberInputElement.inputBox.clear();
      await memberDetailPage.memberInputElement.inputBox.sendKeys(
        errorMember.name,
      );
      /* generate a PUT app-v1/members => an error */
      await memberDetailPage.memberInputElement.actionBtn.click();
      /* check message logged on screen */
      memberDetailPage = getMemberDetailPage();
      const count = await memberDetailPage.rootElements.messages.count();
      const message = await memberDetailPage.rootElements.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to update member on the server');

    });

  });

  describe('handles application exceptions:', () => {

    beforeAll(async() => {
      loadRootPage('#logoutBtn');
    });

    it('Unexpected application error', async () => {

      const logs = await setupLogsMonitor();
      /* test an error was logged */
      logs.expect(/Test application error/, logs.ERROR);

      /* the dashboard page should be displayed */
      let dashboardPage = getDashboardPage();
      /* enter dummy name in search box - triggers application error*/
      await dashboardPage.memberSearchElement.searchBox.sendKeys('errorSearchTerm');
      await browser.sleep(1000);
      /* the error information page is displayed */
      const pageErrorInformationPage = getErrorInformationPage();
      /* shows the header and hint text */
      expect(
        await pageErrorInformationPage.errorInformationElements.header.getText(),
      ).toEqual('UNEXPECTED ERROR!');
      expect(
        await pageErrorInformationPage.errorInformationElements.hint.getText(),
      ).toEqual('Click on a tab link above');
      /* check message logged on screen */
      const count
        = await pageErrorInformationPage.rootElements.messages.count();
      const message = await pageErrorInformationPage.rootElements.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('ErrorHandlerService: ERROR: An unknown error occurred');
      /* check toastr is displayed */
      expect(
        await pageErrorInformationPage.toastrElement.toastr
          .isDisplayed(),
      ).toBe(true);
      expect(
        await pageErrorInformationPage.toastrElement.toastrTitle
          .getText(),
      ).toBe('An unknown error has occurred');
      expect(
        await pageErrorInformationPage.rootElements.toastrMessage
          .getText(),
      ).toBe('ERROR!');
      /* check toastr disappears after timeout */
      var EC = ExpectedConditions;
      await browser.wait(EC.invisibilityOf(pageErrorInformationPage.toastrElement.toastr), 6000);
      expect(
        await pageErrorInformationPage.toastrElement.toastr
          .isDisplayed(),
      ).toBe(false);

    });


  });

});
