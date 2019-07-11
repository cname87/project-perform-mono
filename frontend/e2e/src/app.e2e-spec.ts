import { browser, ElementFinder, by, element } from 'protractor';
import request from 'request-promise-native';
import fs from 'fs';
import path from 'path';

const certFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem');
const keyFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem');
const caFile = path.resolve(__dirname, '../certs/rootCA.crt');
import { getDashboardPage } from './pages/dashboard.page';
import { getMemberDetailPage } from './pages/memberDetail.page';
import { getMembersListPage } from './pages/membersList.page';
import { getErrorInformationPage } from './pages/errorInformation.page';

describe('Project Perform', () => {
  const enum Save {
    False = 0,
    True = 1,
  }

  /* set timeout here - loaded in beforeAll below */
  const timeout = 120000;
  /* set up mock members here - loaded below */
  const mockMembers = [
    { name: 'test11' },
    { name: 'test12' },
    { name: 'test13' },
    { name: 'test4' },
    { name: 'test5' },
  ];

  /**
   * Test if the test database is in use.  If not throw an error so tests do not proceed (possibly overwriting valuable data).
   */
  const isTestDatabase = async () => {
    await browser.waitForAngularEnabled(false);
    await browser.get('/isTestDatabase');
    /* the page content is only { isTestDatabase: <true | false> } */
    const response = await element(by.css('body')).getText();
    await browser.waitForAngularEnabled(true);
    const result = response.substring(response.length - 5, response.length - 1);
    if (result !== 'true') {
      console.error(`Test database not in use. ${result} !== 'true'`);
      throw new Error('Test database not in use');
    } else {
      console.log('Test database confirmed');
      return true;
    }
  };

  /* server request helper function */
  async function askServer(url: string, method: 'POST' | 'DELETE', body = {}) {
    let options = {
      url,
      method,
      cert: fs.readFileSync(certFile),
      key: fs.readFileSync(keyFile),
      ca: fs.readFileSync(caFile),
      json: true,
      body,
    };
    return await request(options);
  }

  /* clear database, load mockmembers and load start page */
  const loadDbAndRootPage = async () => {
    /* delete all 'test' database members */
    await askServer('https://localhost:1337/members', 'DELETE');

    /* add test database members here */
    await askServer('https://localhost:1337/members', 'POST', mockMembers[0]);
    await askServer('https://localhost:1337/members', 'POST', mockMembers[1]);
    await askServer('https://localhost:1337/members', 'POST', mockMembers[2]);
    await askServer('https://localhost:1337/members', 'POST', mockMembers[3]);
    await askServer('https://localhost:1337/members', 'POST', mockMembers[4]);

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
      /* expected values */
      title: 'Project Perform',
      header: 'Team Members',
      linkNames: ['MEMBERS DASHBOARD', 'MEMBERS LIST', 'MEMBER DETAIL'],
      numTopMembers: 4,
      selectedMemberIndex: 2,
      selectedMember: { id: 0, name: '' },
      nameSuffix: 'X',
      newName: '',
      numMembers: 5,
      numMessages1: 1,
      message1: 'MembersService: Fetched all members',
      numMessages2: 2,
      message2: 'MembersService: Fetched member with id = ',
      numMessages3: 7,
      message3: 'MembersService: Deleted member with id = ',
      addedMemberName: 'Added',
      searchTest: 5,
      searchTest1: 3,
      searchTest13: 1,
    };
    expected.selectedMember = {
      /* database empty => id will start at 1 */
      id: expected.selectedMemberIndex + 1,
      name: mockMembers[expected.selectedMemberIndex].name,
    };
    expected.newName = expected.selectedMember.name + expected.nameSuffix;
    expected.message2 = expected.message2 + expected.selectedMember.id;
    expected.message3 = expected.message3 + expected.selectedMember.id;
    return {
      expected,
    };
  };

  /**
   * Assumes the dashboard page is being displayed.
   * Selects a member from the top members dashboard based on a passed in index.
   * The appropriate member detail page is loaded.
   * @param index: Index is zero-based and must correspond to a displayed member, i.e. if 2 is passed in then at least three members must be displayed (and the third member is selected).
   */
  async function dashboardClickMember(index: number) {
    const dashboardPage = getDashboardPage();

    /* get member link and name */
    const { name, link } = await dashboardPage.dashboardElement.selectMember(
      index,
    );

    /* click on the selected member which brings up the member detail page */
    await link.click();
    const memberDetailPage = getMemberDetailPage();
    expect(
      await memberDetailPage.memberDetailElement.tag.isPresent(),
    ).toBeTruthy('shows member detail');

    /* confirm member detail is as expected */
    const member = await memberDetailPage.memberDetailElement.getMember();
    expect(member.name).toEqual(name);
  }

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

  /**
   * The members detail page must be being displayed when this is called.
   * Edits the member name in the members detail page.
   * The expected.nameSuffix is added to the existing member name.
   * @param: save: The save button if clicked if, and only if, the input parameter 'save' is true.
   */
  async function editNameInMemberDetails(save: Save = Save.True) {
    /* get expected values object */
    const { expected } = testSetup();
    /* the member detail page must be displayed */
    const memberDetailPage = getMemberDetailPage();
    /* confirm member detail page is being displayed */
    expect(
      await memberDetailPage.memberDetailElement.tag.isPresent(),
    ).toBeTruthy('shows member detail');
    /* get the member name displayed */
    const originalMember = await memberDetailPage.memberDetailElement.getMember();
    /* add a suffix to the name in the input field */
    await memberDetailPage.memberInputElement.inputBox.sendKeys(
      expected.nameSuffix,
    );
    /* show the member card does not update to match the input text */
    const afterMember = await memberDetailPage.memberDetailElement.getMember();
    expect(originalMember.name).toEqual(afterMember.name);
    if (save) {
      /* saves the new member name and routes back to the last page*/
      await memberDetailPage.memberInputElement.actionBtn.click();
    }
  }

  /**
   * The dashboard page must be being displayed when this is called.
   * Resets the member name in the members detail page.
   * The name is reset to the expected default member.
   */
  async function resetNameInMemberDetails(index: number) {
    /* get expected values object */
    const { expected } = testSetup();
    /* click on a member and go to the member detail page */
    let dashboardPage = getDashboardPage();
    /* get member link and name */
    const { link } = await dashboardPage.dashboardElement.selectMember(index);
    await link.click();
    /* the member detail page is now displayed */
    const memberDetailPage = getMemberDetailPage();
    /* confirm member detail page is being displayed */
    expect(
      await memberDetailPage.memberDetailElement.tag.isPresent(),
    ).toBeTruthy('shows member detail');
    /* get the member name */
    const readMember = await memberDetailPage.memberDetailElement.getMember();
    /* clear input box */
    await memberDetailPage.memberInputElement.inputBox.clear();
    /* slice off the last character of the member name */
    await memberDetailPage.memberInputElement.inputBox.sendKeys(
      readMember.name.slice(0, -1),
    );
    /* saves the new member name and routes back to the dashboard page */
    await memberDetailPage.memberInputElement.actionBtn.click();
    /* the dashboard page is now displayed */
    dashboardPage = getDashboardPage();
    /* confirm dashboard page is being displayed */
    expect(await dashboardPage.dashboardElement.tag.isPresent()).toBeTruthy(
      'shows dashboard page',
    );
    /* confirm name of member on dashboard has been updated */
    const { name } = await dashboardPage.dashboardElement.selectMember(
      expected.selectedMemberIndex,
    );
    expect(name).toEqual(expected.selectedMember.name);
  }

  /* check test database and set timeout */
  let originalTimeout: number;
  beforeAll(async () => {
    /* check the 'test' database is in use - if not an error will be thrown */
    await isTestDatabase();
    /* set timeout to allow for debug */
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  /* clear database and reset timeout value to the original value */
  afterAll(async () => {
    /* delete all 'test' database members */
    await askServer('https://localhost:1337/members', 'DELETE');
    /* reset timeout */
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  describe('has', () => {
    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it('the dashboard page as the start page', async () => {
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.dashboardElement.tag.isPresent()).toBeTruthy();
    });

    it('a web page with the expected title', async () => {
      const { expected } = testSetup();
      expect(await browser.getTitle()).toEqual(
        expected.title,
        'browser tab title',
      );
    });

    it('a dashboard page with the expected header', async () => {
      const { expected } = testSetup();
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.rootElement.header.getText()).toEqual(
        expected.header,
        'dashboard header',
      );
    });

    it(`a root element with the expected links`, async () => {
      const { expected } = testSetup();
      const dashboardPage = getDashboardPage();
      const linkNames = await dashboardPage.rootElement.navElements.map(
        (el?: ElementFinder) => el!.getText(),
      );
      expect(linkNames).toEqual(expected.linkNames as any, 'root links');
    });

    it('a dashboard page with top members displayed', async () => {
      const { expected } = testSetup();
      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();
      /* get the count of the members showing in the top members dashboard */
      const count = await dashboardPage.dashboardElement.topMembers.count();
      expect(count).toEqual(expected.numTopMembers, 'number of members');
    });

    it('a dashboard page with messages displayed', async () => {
      const { expected } = testSetup();
      /* the dashboard page should still be displayed */
      const dashboardPage = getDashboardPage();
      /* get the messages showing in the message element */
      const count = await dashboardPage.messagesElement.messages.count();
      expect(count).toEqual(expected.numMessages1, 'number of messages');
      const message = await dashboardPage.messagesElement.messages
        .get(0)
        .getText();
      expect(message).toEqual(expected.message1);
    });

    it('a members list page with all members', async () => {
      const { expected } = testSetup();
      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
    });

    it('a members list page which displays correctly styled buttons', async () => {
      /* the member detail page is still displayed */
      let membersListPage = getMembersListPage();
      const deleteButtons = await membersListPage.memberListElement
        .allDeleteBtns;
      /* test all delete buttons */
      for (const button of deleteButtons) {
        /* 2 styles that material uses */
        expect(await button.getCssValue('border')).toContain('none');
        expect(await button.getCssValue('border-radius')).toBe('4px');
      }
    });

    it('a members list page with a link which routes back to the dashboard page', async () => {
      /* the member detail page is still displayed */
      const membersListPage = getMembersListPage();
      /* click on members nav link */
      await membersListPage.rootElement.dashboardLink.click();
      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.dashboardElement.tag.isPresent()).toBeTruthy(
        'shows dashboard page',
      );
    });

    it('an error information / page not found page', async () => {
      /* browse to a non-routed page */
      await browser.get('nonexistentPage');
      /* await page not found display */
      browser.ignoreSynchronization = true;
      await browser.wait(() => {
        return browser.isElementPresent(by.css('app-error-information'));
      }, 5000);
      browser.ignoreSynchronization = false;
      /* the member detail page is still displayed */
      const pageErrorInformationPage = getErrorInformationPage();
      /* shows the page not found page */
      expect(
        await pageErrorInformationPage.errorInformationElement.tag.isPresent(),
      ).toBeTruthy('shows error information - page not found page');
      /* shows the header and hint text */
      expect(
        await pageErrorInformationPage.errorInformationElement.header.getText(),
      ).toEqual('PAGE NOT FOUND');
      expect(
        await pageErrorInformationPage.errorInformationElement.hint.getText(),
      ).toEqual('Click on a tab link above');
    });
  });

  describe('has a dashboard & member detail page flow that', () => {
    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it(`selects a member and routes to the members details page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.selectedMemberIndex);
      const memberDetailPage = getMemberDetailPage();
      /* confirm member detail page is being displayed */
      expect(
        await memberDetailPage.memberDetailElement.tag.isPresent(),
      ).toBeTruthy('shows member detail');
      /* confirm header is showing member name */
      expect(
        await memberDetailPage.memberDetailElement.getHeaderName(),
      ).toEqual(expected.selectedMember.name.toUpperCase());
      /* confirm input is showing member name */
      expect(
        await memberDetailPage.memberInputElement.inputBox.getAttribute(
          'value',
        ),
      ).toEqual(expected.selectedMember.name);
    });

    it('has a member detail page that shows a message', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      /* get the messages showing in the message element */
      const count = await memberDetailPage.messagesElement.messages.count();
      expect(count).toEqual(expected.numMessages2, 'number of messages');
      const message = await memberDetailPage.messagesElement.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual(expected.message2);
    });

    it('updates and saves a member name in members details page input box and routes back to the dashboard display and shows the new member name', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* edit member name in member detail page and click save */
      await editNameInMemberDetails(Save.True);
      /* the dashboard page is now displayed */
      const dashboardPage = getDashboardPage();
      /* confirm dashboard page is being displayed */
      expect(await dashboardPage.dashboardElement.tag.isPresent()).toBeTruthy(
        'shows dashboard page',
      );
      /* confirm name of member on dashboard has been updated */
      const { name } = await dashboardPage.dashboardElement.selectMember(
        expected.selectedMemberIndex,
      );
      expect(name).toEqual(expected.newName);
      /* reset member name so next test starting fresh */
      await resetNameInMemberDetails(expected.selectedMemberIndex);
    });

    it(`updates but cancels member detail name change and routes back to the dashboard page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is now displayed */
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.selectedMemberIndex);
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      /* click go back, which cancels name change and goes back to the dashboard page */
      await memberDetailPage.memberDetailElement.goBackBtn.click();
      /* the dashboard page is now displayed */
      const dashboardPage = getDashboardPage();
      /* confirm dashboard page is being displayed */
      expect(await dashboardPage.dashboardElement.tag.isPresent()).toBeTruthy(
        'shows member detail',
      );
      /* confirm name of member on dashboard */
      const { name } = await dashboardPage.dashboardElement.selectMember(
        expected.selectedMemberIndex,
      );
      /* the member name is unchanged */
      expect(name).toEqual(expected.selectedMember.name);
    });
  });

  describe('has a members list and member detail page flow that', () => {
    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it('switches to the members list page', async () => {
      const { expected } = testSetup();
      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
    });

    it('selects a member and routes to the members details view', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the members list page should still be displayed */
      const membersPage = getMembersListPage();
      /* get the link of the selected member */
      const {
        memberName,
      } = await membersPage.memberListElement.selectMemberById(
        expected.selectedMember.id,
      );
      /* click on the member which takes us to the member detail view */
      await memberName.click();
      const memberDetailPage = getMemberDetailPage();
      /* confirm member detail page is being displayed */
      expect(
        await memberDetailPage.memberDetailElement.tag.isPresent(),
      ).toBeTruthy('shows member detail');
      /* get the member from the member detail page */
      const member = await memberDetailPage.memberDetailElement.getMember();
      expect(member.id).toEqual(expected.selectedMember.id, 'member id');
      expect(member.name).toEqual(expected.selectedMember.name, 'member name');
    });

    it('updates and saves a member name in members details page input box and routes back to members list which shows the updated name', async () => {
      /* edit member name in member detail page and click save */
      await editNameInMemberDetails(Save.True);
      /* the members list page is now displayed */
      const membersListPage = getMembersListPage();
      expect(
        await membersListPage.memberListElement.tag.isPresent(),
      ).toBeTruthy('shows member list');
    });

    it(`shows the member's new name in the members list page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the members list page is still displayed */
      const membersPage = getMembersListPage();
      expect(await membersPage.memberListElement.tag.isPresent()).toBeTruthy();
      /* confirm count of members displayed */
      expect(await membersPage.memberListElement.allMemberIds.count()).toEqual(
        expected.numMembers,
        'number of members',
      );
      /* confirm member id and member new name displayed */
      const {
        memberId,
        memberName,
      } = membersPage.memberListElement.selectMemberById(
        expected.selectedMember.id,
      );
      expect(+(await memberId.getText())).toBe(expected.selectedMember.id);
      expect(await memberName.getText()).toEqual(expected.newName);
    });

    it(`deletes a member from the members list page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member list page is now displayed */
      let membersListPage = getMembersListPage();
      /* get the list of members */
      const membersBefore = await membersListPage.memberListElement.getMembersArray();
      const {
        deleteButton,
      } = await membersListPage.memberListElement.selectMemberById(
        expected.selectedMember.id,
      );
      /* click 'delete' which deletes the member & stays on the members view */
      await deleteButton.click();
      membersListPage = getMembersListPage();
      expect(
        await membersListPage.memberListElement.tag.isPresent(),
      ).toBeTruthy('shows members list');
      /* confirm count of members displayed is down by one */
      expect(
        await membersListPage.memberListElement.allMemberIds.count(),
      ).toEqual(expected.numMembers - 1, 'number of members');
      /* get the updated list of members */
      const membersAfter
        = await membersListPage.memberListElement.getMembersArray();
      /* filter deleted member for the members before array and compare */
      const expectedMembers = membersBefore.filter(
        (h) => h.name !== expected.newName,
      );
      expect(membersAfter).toEqual(expectedMembers);
    });

    it('shows a message', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member list page is displayed */
      let membersListPage = getMembersListPage();
      /* get the messages showing in the message element */
      const count = await membersListPage.messagesElement.messages.count();
      expect(count).toEqual(expected.numMessages3, 'number of messages');
      const message = await membersListPage.messagesElement.messages
        .get(count - 2) // last message is the getMembers update
        .getText();
      expect(message).toEqual(expected.message3);
    });

    it('clears the messages list', async () => {
      /* the member list page is displayed */
      let membersListPage = getMembersListPage();
      /* clear the messages list */
      await membersListPage.messagesElement.clearBtn.click();
      await browser.sleep(1000);
      /* get the messages showing in the message element */
      const count = await membersListPage.messagesElement.messages.count();
      expect(count).toEqual(0, 'no messages');
    });

    it(`adds a member on the members list page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member detail page is still displayed */
      let membersListPage = getMembersListPage();
      /* get the list of members */
      const membersBefore = await membersListPage.memberListElement.getMembersArray();
      const numMembers = membersBefore.length;
      /* enter new name in input box */
      await membersListPage.memberInputElement.inputBox.sendKeys(
        expected.addedMemberName,
      );
      /* click on add which saves member and stays on members view */
      await membersListPage.memberInputElement.actionBtn.click();
      membersListPage = getMembersListPage();
      expect(
        await membersListPage.memberListElement.tag.isPresent(),
      ).toBeTruthy('shows member list');
      /* confirm added member is displayed */
      let membersAfter = await membersListPage.memberListElement.getMembersArray();
      expect(membersAfter.length).toEqual(numMembers + 1, 'number of members');
      /* slice last member of the new list and confirm previous list still there */
      expect(membersAfter.slice(0, numMembers)).toEqual(
        membersBefore,
        'old members are still there',
      );
      /* confirm id incremented from previous maximum id */
      const maxId = membersBefore[membersBefore.length - 1].id;
      expect(membersAfter[numMembers]).toEqual({
        id: maxId + 1,
        name: expected.addedMemberName,
      });
    });
  });

  describe('has a progressive member search that', () => {
    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it(`searches for 'test'`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page should be displayed */
      let dashboardPage = getDashboardPage();
      expect(
        await dashboardPage.memberSearchElement.tag.isPresent(),
      ).toBeTruthy('shows member search box');
      /* enter 'text' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('test');
      await browser.sleep(1000);
      dashboardPage = getDashboardPage();
      expect(
        await dashboardPage.memberSearchElement.searchResults.count(),
      ).toEqual(expected.searchTest);
    });

    it(`continues search with '1'`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();
      /* enter '1' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('1');
      browser.sleep(1000);
      expect(
        await dashboardPage.memberSearchElement.searchResults.count(),
      ).toEqual(expected.searchTest1);
    });

    it(`continues search with '3' and gets 1 member`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();
      /* enter '3' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('3');
      browser.sleep(1000);
      expect(
        await dashboardPage.memberSearchElement.searchResults.count(),
      ).toEqual(expected.searchTest13);
      /* confirm member found */
      let member = dashboardPage.memberSearchElement.searchResults.get(0);
      expect(await member.getText()).toEqual(expected.selectedMember.name);
    });

    it('selects the found member and goes to the member details view', async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();
      /* get the sole found member */
      const foundMember = dashboardPage.memberSearchElement.searchResults.get(
        0,
      );
      expect(await foundMember.getText()).toEqual(expected.selectedMember.name);
      /* click on the found member */
      await foundMember.click();
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      expect(
        await memberDetailPage.memberDetailElement.tag.isPresent(),
      ).toBeTruthy('shows member detail');
      /* show the member matches the expected member */
      const member = await memberDetailPage.memberDetailElement.getMember();
      expect(member.id).toEqual(expected.selectedMember.id);
      expect(member.name).toEqual(expected.selectedMember.name);
    });
  });
});
