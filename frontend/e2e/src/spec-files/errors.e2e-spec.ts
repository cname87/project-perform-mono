import { browser, by, ExpectedConditions } from 'protractor';
import browserLogs from 'protractor-browser-logs';

import { resetDatabase} from '../../../utils/reset-testDatabase';
import { getDashboardPage } from '../pages/dashboard.page';
import { getMemberDetailPage } from '../pages/memberDetail.page';
import { getMembersListPage } from '../pages/membersList.page';
import { getErrorInformationPage } from '../pages/error-information.page';
import { errorMember } from '../../../src/app/config';

describe('Error Handling', () => {

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
    await dashboardPage.rootElement.membersLink.click();
    /* the members list page should be displayed */
    const membersListPage = getMembersListPage();
    expect(await membersListPage.memberListElement.tag.isPresent()).toBeTruthy(
      'shows member list',
    );

    /* confirm count of members displayed */
    expect(
      await membersListPage.memberListElement.allMemberIds.count(),
    ).toEqual(numberExpected, 'number of members');
  }

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
    /* clear browser log before test */
    browser.manage().logs().get('browser');
    logs = browserLogs(browser);
    logs.ignore(logs.DEBUG);
    logs.ignore(logs.INFO);
  });

  afterEach(() => {
    return logs.verify();
  });

  describe('handles server request errors:', () => {

    beforeAll(loadRootPage);

    it(`GET /members?name='error' causes an unexpected error`, async () => {
      /* the dashboard page should be displayed */
      let dashboardPage = getDashboardPage();
      /* enter dummy text in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('error');
      await browser.sleep(1000);
      /* check message logged on screen */
      dashboardPage = getDashboardPage();
      const count = await dashboardPage.messagesElement.messages.count();
      const message = await dashboardPage.messagesElement.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to get members from server');
      /* check toastr is displayed */
      expect(
        await dashboardPage.toastrElement.toastr
          .isDisplayed(),
      ).toBe(true);
      expect(
        await dashboardPage.toastrElement.toastrTitle
          .getText(),
      ).toBe('A server access error has occurred');
      expect(
        await dashboardPage.toastrElement.toastrMessage
          .getText(),
      ).toBe('ERROR!');
      /* test an error is logged */
      logs.expect(/Test unexpected error/, logs.ERROR);
    });

    it('DELETE /members/10 causes an unexpected error', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
      /* the members list page should be displayed */
      let membersListPage = getMembersListPage();
      /* get the link of the member 9 without error */
      const {
        deleteButton,
      } = await membersListPage.memberListElement.selectMemberById(
        errorMember.id,
      );
      /* generates DELETE members/10 => error */
      await deleteButton.click();
      /* check message logged on screen */
      membersListPage = getMembersListPage();
      const count = await membersListPage.messagesElement.messages.count();
      const message = await membersListPage.messagesElement.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to delete member from server');
      /* check toastr is displayed */
      expect(
        await membersListPage.toastrElement.toastr
          .isDisplayed(),
      ).toBe(true);
      expect(
        await membersListPage.toastrElement.toastrTitle
          .getText(),
      ).toBe('A server access error has occurred');
      expect(
        await membersListPage.toastrElement.toastrMessage
          .getText(),
            ).toBe('ERROR!');
      /* test an error is logged */
      logs.expect(/Test unexpected error/, logs.ERROR);
    });

    it(`POST /members causes a server-side  error`, async () => {
      /* the member detail page is still displayed */
      let membersListPage = getMembersListPage();
      /* get the list of members */
      /* enter new name in input box */
      await membersListPage.memberInputElement.inputBox.sendKeys(
        errorMember.name,
      );
      /* click on add which saves member and stays on members view */
      await membersListPage.memberInputElement.actionBtn.click();
      membersListPage = getMembersListPage();
      /* check message logged on screen */
      membersListPage = getMembersListPage();
      const count = await membersListPage.messagesElement.messages.count();
      const message = await membersListPage.messagesElement.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to add member to server');
      /* test that an error is logged */
      logs.expect(/Test server-side error/, logs.ERROR);
    });

    it('GET /members/10 causes a HttpClient error', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
      /* the members list page should be displayed */
      let membersListPage = getMembersListPage();
      /* get the link of the member 9 without error */
      const {
        memberName,
      } = await membersListPage.memberListElement.selectMemberById(
        errorMember.id,
      );
      /* click on the member which takes us to the member detail view */
      await memberName.click();
      /* check message logged on screen */
      membersListPage = getMembersListPage();
      const count = await membersListPage.messagesElement.messages.count();
      const message = await membersListPage.messagesElement.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to get member from server');
      /* test that an error is logged */
      logs.expect(/Http client-side/, logs.ERROR);
    });

    it('PUT /members causes a server-side error', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
      /* the members list page should be displayed */
      const membersPage = getMembersListPage();
      /* get the link of the member 9 without error */
      const {
        memberName,
      } = await membersPage.memberListElement.selectMemberById(
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
      const count = await memberDetailPage.messagesElement.messages.count();
      const message = await memberDetailPage.messagesElement.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual('MembersService: ERROR: Failed to update member on the server');
      /* test that an error is logged */
      logs.expect(/Test server-side error/, logs.ERROR);
    });

  });

  describe('handles application exceptions:', () => {

    beforeAll(loadRootPage);

    it('Unexpected application error', async () => {
      /* the dashboard page should be displayed */
      let dashboardPage = getDashboardPage();
      /* enter dummy name in search box - triggers application error*/
      await dashboardPage.memberSearchElement.searchBox.sendKeys('errorSearchTerm');
      await browser.sleep(1000);
      /* the error information page is displayed */
      const pageErrorInformationPage = getErrorInformationPage();
      /* shows the error information page */
      expect(
        await pageErrorInformationPage.errorInformationElement.tag.isPresent(),
      ).toBeTruthy('shows error information');
      /* shows the header and hint text */
      expect(
        await pageErrorInformationPage.errorInformationElement.header.getText(),
      ).toEqual('UNEXPECTED ERROR!');
      expect(
        await pageErrorInformationPage.errorInformationElement.hint.getText(),
      ).toEqual('Click on a tab link above');
      /* check message logged on screen */
      const count
        = await pageErrorInformationPage.messagesElement.messages.count();
      const message = await pageErrorInformationPage.messagesElement.messages
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
        await pageErrorInformationPage.toastrElement.toastrMessage
          .getText(),
      ).toBe('ERROR!');
      /* check toastr disappears after timeout */
      var EC = ExpectedConditions;
      await browser.wait(EC.invisibilityOf(pageErrorInformationPage.toastrElement.toastr), 6000);
      expect(
        await pageErrorInformationPage.toastrElement.toastr
          .isDisplayed(),
      ).toBe(false);
      /* test an appropriate  error was logged */
      logs.expect(/Test application error/, logs.ERROR);
    });


  });

});
