import {
  browser,
  ElementFinder,
  by,
  element,
} from 'protractor';
import request from 'request-promise-native';
import fs from 'fs';
import path from 'path';

const certFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem')
const keyFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem')
const caFile = path.resolve(__dirname, '../certs/rootCA.crt')
import { getDashboardPage }from './pages/dashboard.page';
import { getMemberDetailPage } from './pages/memberDetail.page';
import { getMembersListPage } from './pages/membersList.page';
import { getPageNotFoundPage } from './pages/pageNotFound.page';

describe('Project Perform', () => {

  /* set timeout here - loaded in beforeAll below */
  const timeout = 120000;
  /* set up mock members here - loaded below */
  const mockMembers = [
    { name: 'test11' },
    { name: 'test12' },
    { name: 'test13' },
    { name: 'test4' },
    { name: 'test5' },
  ]

  /**
   * Test if the test database is in use.  If not throw an error so tests do not proceed (possibly overwriting valuable data).
   */
  const isTestDatabase = async () => {
    await browser.waitForAngularEnabled(false);
    await browser.get('/isTestDatabase');
    /* the page content is only { isTestDatabase: true/false } */
    const response = await element(by.css('body')).getText();
    await browser.waitForAngularEnabled(true);
    const result = response.substring(response.length - 5, response.length-1);
    if (result !== 'true') {
      console.error(`Test database not in use. ${result} !== 'true'`);
      throw new Error('Test database not in use');
    } else {
      console.log('Test database confirmed');
      return true;
    }
  }

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
    }
    return await request(options);
  }

  /* clear database, load mockmembers and load start page */
  const loadDbAndRootPage = async () => {

    /* delete all 'test' database members */
    await askServer('https://localhost:1337/members', 'DELETE');

    /* add test database members here */
    await askServer(
      'https://localhost:1337/members',
      'POST',
      mockMembers[0],
    );
    await askServer(
      'https://localhost:1337/members',
      'POST',
      mockMembers[1],
    );
    await askServer(
      'https://localhost:1337/members',
      'POST',
      mockMembers[2],
    );
    await askServer(
      'https://localhost:1337/members',
      'POST',
      mockMembers[3],
    );
    await askServer(
      'https://localhost:1337/members',
      'POST',
      mockMembers[4],
    );

    /* load the root page */
    await browser.get('/');
    browser.ignoreSynchronization = true;
    await browser.wait(() => {
      return browser.isElementPresent(by.css('app-root'));
    }, 5000);
    browser.ignoreSynchronization = false;
  }

  /* run before each 'it' function to supply local variables e.g. expected values for tests */
  const testSetup = () => {
    const expected = {
      /* expected values */
      title: 'Team Members',
      header: 'Team Members',
      linkNames: [ 'MEMBERS LIST' ],
      numTopMembers: 4,
      topMemberIndex: 2,
      member: { id: 0, name: '' },
      nameSuffix: 'X',
      newName: '',
      numMembers: 5,
      numMessages1: 1,
      message1: 'MembersService: Fetched all members',
      numMessages2: 2,
      message2: 'MembersService: Fetched member with id = ',
      numMessages3: 6,
      message3: 'MembersService: Deleted member with id = ',
      addedMemberName: 'Added',
      searchTest: 5,
      searchTest1: 3,
      searchTest13: 1,
    }
    expected.member = {
       /* database empty => id will start at 1 */
      id: expected.topMemberIndex + 1,
      name: mockMembers[expected.topMemberIndex].name,
    }
    expected.newName
      = expected.member.name + expected.nameSuffix;
    expected.message2 = expected.message2 + expected.member.id;
    expected.message3 = expected.message3 + expected.member.id;
    return {
      expected,
    }
  };

  /**
   * Assumes the dashboard page is being displayed.
   * Selects a member from the top members dashboard based on a passed in index.
   * The appropriate member detail page is loaded.
   * @param index Zero-based index which selects a member from the top members displayed in the dashboard.
   */
  async function dashboardClickMember(index: number) {
    const dashboardPage = getDashboardPage();
    const { expected }= testSetup();

    /* get member link and name */
    const { name, link } = await dashboardPage.dashboardElement
      .selectMember(index);
    expect(name).toEqual(expected.member.name);

    /* click on the selected member which brings up the member detail page */
    await link.click();
    const memberDetailPage = getMemberDetailPage();
    expect(await memberDetailPage.memberDetailElement.tag
      .isPresent())
      .toBeTruthy('shows member detail');

    /* confirm member detail is as expected */
    const member
      = await memberDetailPage.memberDetailElement.getMember();
    expect(member.id).toEqual(expected.member.id);
    expect(member.name)
      .toEqual(expected.member.name
      .toUpperCase());
  }

    /**
   * Assumes the dashboard page is being displayed.
   * Clicks on the members link.
   * The members list page is loaded.
   */
  async function getMembersList() {
    /* get expected values object */
    const { expected } = testSetup();
    /* the dashboard page should be displayed */
    const dashboardPage = getDashboardPage();
    /* click on members nav link */
    await dashboardPage.rootElement.membersLink.click();
    /* the list members page should be displayed */
    const membersListPage = getMembersListPage();
    expect(await membersListPage.memberListElement.tag
      .isPresent())
      .toBeTruthy('shows member list');
    /* confirm count of members displayed */
    expect(await membersListPage.memberListElement.allMembers
      .count()).toEqual(
        expected.numMembers,
       'number of members'
      );
  }

  async function editName() {
    /* get expected values object */
    const { expected } = testSetup();
    /* the member detail page is now displayed */
    const memberDetailPage = getMemberDetailPage();
    /* confirm member detail page is being displayed */
    expect(await memberDetailPage.memberDetailElement.tag
      .isPresent())
      .toBeTruthy('shows member detail');
    /* confirm header is showing member name */
    expect(await memberDetailPage.memberDetailElement.header.getText())
      .toEqual(expected.member.name.toUpperCase() + ' Details');
    /* confirm input is showing member name */
    expect(await memberDetailPage.memberDetailElement.input
      .getAttribute('value'))
      .toEqual(expected.member.name);
    /* add a suffix to the name in the input field */
    await memberDetailPage.memberDetailElement.input
      .sendKeys(expected.nameSuffix);
    /* show the header updates to match the input text */
    const member = await memberDetailPage.memberDetailElement.getMember();
    expect(member.id).toEqual(expected.member.id);
    expect(member.name)
      .toEqual(expected.newName.toUpperCase());
  }
  /* check test database and set timeout */
  let originalTimeout: number;
  beforeAll(async() => {
    /* check the 'test' database is in use - if not an error will be thrown */
    await isTestDatabase();
    /* set timeout to allow for debug */
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  /* clear database and reset timeout value to the original value */
  afterAll(async() => {
    /* delete all 'test' database members */
    await askServer('https://localhost:1337/members', 'DELETE');
    /* reset timeout */
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  })

  describe('has', () => {

    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it('the dashboard page as the start page', async () => {
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.dashboardElement.tag.isPresent()).toBeTruthy();
    });

    it('a dashboard page with the expected title', async () => {
      const { expected } = testSetup();
      expect(await browser.getTitle()).toEqual(expected.title, 'browser tab title');
    });

    it('a dashboard page with the expected header', async () => {
      const { expected } = testSetup();
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.rootElement.header
        .getText()).toEqual(expected.header, 'dashboard header');
    });

    it(`a root element with the expected links`, async () => {
      const { expected } = testSetup();
      const dashboardPage = getDashboardPage();
      const linkNames = await dashboardPage.rootElement.navElements
        .map((el?: ElementFinder) =>
          el!.getText(),
        );
      expect(linkNames).toEqual(expected.linkNames as any, 'root links');
    });

    it('a dashboard page with top members displayed', async() => {
      const { expected } = testSetup();
      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();
      /* get the count of the members showing in the top members dashboard */
      const count = await dashboardPage.dashboardElement.topMembers.count();
      expect(count).toEqual(expected.numTopMembers, 'number of members');
    });

    it('a dashboard page with messages displayed', async() => {
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

    it('a members list page with all members',
      getMembersList,
    );

    it('a members list page which displays correctly styled buttons', async () => {
      /* the member detail page is still displayed */
      let membersListPage = getMembersListPage();
      const deleteButtons = await membersListPage.memberListElement.deleteBtns;
      /* test all delete buttons */
      for (const button of deleteButtons) {
        /* inherited styles from styles.css */
        expect(await button.getCssValue('font-family')).toBe('Arial');
        expect(await button.getCssValue('border')).toContain('none');
        expect(await  button.getCssValue('padding')).toBe('5px 10px');
        expect(await button.getCssValue('border-radius')).toBe('4px');
        /* styles defined in members.component.css */
        expect(await button.getCssValue('left')).toBe('194px');
        expect(await button.getCssValue('top')).toBe('-34px');
      }
      const addButton = membersListPage.memberListElement.addBtn;
      /* inherited styles from styles.css */
      expect(await addButton.getCssValue('font-family')).toBe('Arial');
      expect(await addButton.getCssValue('border')).toContain('none');
      expect(await addButton.getCssValue('padding')).toBe('5px 10px');
      expect(await addButton.getCssValue('border-radius')).toBe('4px');
    });

    it('a link which routes back to the dashboard page', async () => {
      /* the member detail page is still displayed */
      const membersListPage = getMembersListPage();
      /* click on members nav link */
      await membersListPage.rootElement.dashboardLink.click();
      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.dashboardElement.tag
        .isPresent())
        .toBeTruthy('shows dashboard page');
    });

    it('a page not found page', async () => {
      /* browse to a non-routed page */
      await browser.get('nonexistentPage');
      browser.ignoreSynchronization = true;
      await browser.wait(() => {
        return browser.isElementPresent(by.css('app-page-not-found'));
      }, 5000);
      browser.ignoreSynchronization = false;
      /* the member detail page is still displayed */
      const pageNotFoundPage = getPageNotFoundPage();
      /* shows the page not found page */
      expect(await pageNotFoundPage.pageNotFoundElement.tag
        .isPresent())
        .toBeTruthy('shows page not found page');
      expect(await pageNotFoundPage.pageNotFoundElement.header.getText()).toEqual('Page not found')
    });
  });

  describe('has a dashboard & member detail page flow that', () => {

    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it(`selects a member and routes to the members details page`, async() => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.topMemberIndex);
    });

    it('shows a message', async() => {
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

    it(`updates member name in members details page input box`,
      editName,
    );

    it(`cancels member detail name change and routes back to the dashboard page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      /* click go back, which cancels name change and goes back to the dashboard page */
      await memberDetailPage.memberDetailElement.goBackBtn.click();
      /* the dashboard page is now displayed */
      const dashboardPage = getDashboardPage();
      /* confirm dashboard page is being displayed */
      expect(await dashboardPage.dashboardElement.tag
        .isPresent())
        .toBeTruthy('shows member detail');
      /* confirm name of member on dashboard */
      const { name } = await dashboardPage.dashboardElement
        .selectMember(expected.topMemberIndex);
      expect(name).toEqual(expected.member.name);
    });

    it(`selects a member and routes to the members details page`, async() => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.topMemberIndex);
    });

    it(`updates member name in members details page input box`,
      editName,
    );

    it(`saves and shows the new name in the dashboard page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      /* click save, which saves name and goes back to the dashboard page */
      await memberDetailPage.memberDetailElement.saveBtn.click();
      /* the dashboard page is now displayed */
      const dashboardPage = getDashboardPage();
      /* confirm dashboard page is being displayed */
      expect(await dashboardPage.dashboardElement.tag
        .isPresent())
        .toBeTruthy('shows member detail');
      /* confirm name of member on dashboard */
      const { name } = await dashboardPage.dashboardElement
        .selectMember(expected.topMemberIndex);
      expect(name).toEqual(expected.newName);
    });
  });

  describe('has a members list and member detail page flow that', () => {
    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it('switches to the members list page',
      getMembersList,
    );

    it(`selects a member and routes to the members details view`, async() => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the members list page should still be displayed */
      const membersPage = getMembersListPage();
      /* get the link of the selected member */
      const { memberLink } = await membersPage.memberListElement
        .selectMemberById(expected.member.id);
      /* click on the member which takes us to the member detail view */
      await memberLink.click();
      const memberDetailPage = getMemberDetailPage();
      /* confirm member detail page is being displayed */
      expect(await memberDetailPage.memberDetailElement.tag
        .isPresent())
        .toBeTruthy('shows member detail');
      /* get the member from the member detail page */
      const member = await memberDetailPage.memberDetailElement.getMember();
      expect(member.id).toEqual(expected.member.id, 'member id');
      expect(member.name)
        .toEqual(expected.member.name.toUpperCase(), 'member name');
    });

    it(`updates the member name in the members details page input box`,
      editName,
    );

    it(`saves the new name and shows the member's new name in the members list page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member detail page is still displayed */
      const memberDetailPage = getMemberDetailPage();
      /* click save, which saves name and goes back to the dashboard page */
      await memberDetailPage.memberDetailElement.saveBtn.click();
      /* the dashboard page is now displayed */
      const dashboardPage = getDashboardPage();
      /* click on members nav link */
      await dashboardPage.rootElement.membersLink.click();
      /* the list members page should be displayed */
      const membersPage = getMembersListPage();
      expect(await membersPage.memberListElement.tag.isPresent()).toBeTruthy();
      /* confirm count of members displayed */
      expect(await membersPage.memberListElement.allMembers
        .count()).toEqual(
          expected.numMembers,
         'number of members'
        );
      /* confirm member id and member new name displayed */
      let expectedText =
        `${expected.member.id} ${expected.newName}`;
      const { memberLink } = membersPage.memberListElement
        .selectMemberById(expected.member.id);
      expect(await memberLink.getText()).toEqual(expectedText);
    });

    it(`deletes a member from the members list page`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member list page is now displayed */
      let membersListPage = getMembersListPage();
      /* get the list of members */
      const membersBefore
        = await membersListPage.memberListElement.getMembersArray();
      const { deleteButton } = await membersListPage.memberListElement
        .selectMemberById(expected.member.id);
      /* click 'delete' which deletes the member & stays on the members view */
      await deleteButton.click();
      membersListPage = getMembersListPage();
      expect(await membersListPage.memberListElement.tag
        .isPresent())
        .toBeTruthy('shows members list');
      /* confirm count of members displayed is down by one */
      expect(await membersListPage.memberListElement.allMembers
        .count()).toEqual(
          expected.numMembers - 1,
         'number of members'
        );
      /* get the updated list of members */
      const membersAfter
      = await membersListPage.memberListElement.getMembersArray();
      /* filter deleted member for the members before array and compare */
      const expectedMembers = membersBefore
        .filter((h) => h.name !== expected.newName);
      expect(membersAfter).toEqual(expectedMembers);
    });

    it('shows a message', async() => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the member list page is displayed */
      let membersListPage = getMembersListPage();
      /* get the messages showing in the message element */
      const count = await membersListPage.messagesElement.messages.count();
      expect(count).toEqual(expected.numMessages3, 'number of messages');
      const message = await membersListPage.messagesElement.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual(expected.message3);
    });

      it('clears the messages list', async() => {
        /* get expected values object */
        const { } = testSetup();
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
      const membersBefore
        = await membersListPage.memberListElement.getMembersArray();
      const numMembers = membersBefore.length;
      /* enter new name in input box */
      await membersListPage.memberListElement.input
        .sendKeys(expected.addedMemberName);
      /* click on add which saves member and stays on members view */
      await membersListPage.memberListElement.addBtn.click();
      membersListPage = getMembersListPage();
      expect(await membersListPage.memberListElement.tag
        .isPresent())
        .toBeTruthy('shows member list');
      /* confirm added member is displayed */
      let membersAfter
        = await membersListPage.memberListElement.getMembersArray();
      expect(membersAfter.length).toEqual(numMembers + 1, 'number of members');
      /* slice last member of the new list and confirm previous list still there */
      expect(membersAfter.slice(0, numMembers))
        .toEqual(
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
      expect(await dashboardPage.memberSearchElement.tag
        .isPresent())
        .toBeTruthy('shows member search box');
      /* enter 'text' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('test');
      await browser.sleep(1000);
      dashboardPage = getDashboardPage();
      expect(await dashboardPage.memberSearchElement.searchResults.count()).toEqual(expected.searchTest);
    });

    it(`continues search with '1'`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();
      /* enter '1' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('1');
      browser.sleep(1000);
      expect(await dashboardPage.memberSearchElement.searchResults.count()).toEqual(expected.searchTest1);
    });

    it(`continues search with '3' and gets 1 member`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();
      /* enter '3' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('3');
      browser.sleep(1000);
      expect(await dashboardPage.memberSearchElement.searchResults.count()).toEqual(expected.searchTest13);
      /* confirm member found */
      let member = dashboardPage.memberSearchElement.searchResults.get(0);
      expect(await member.getText()).toEqual(expected.member.name);
    });

    it(`selects the found member and goes to the member details view`, async () => {
      /* get expected values object */
      const { expected } = testSetup();
      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();
      /* get the sole found member */
      const foundMember = dashboardPage.memberSearchElement.searchResults
        .get(0);
      expect(await foundMember.getText()).toEqual(expected.member.name)
      /* click on the found member */
      await foundMember.click();
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      expect(await memberDetailPage.memberDetailElement.tag
        .isPresent())
        .toBeTruthy('shows member detail');
      /* show the member matches the expected member */
      const member = await memberDetailPage.memberDetailElement.getMember();
      expect(member.id).toEqual(expected.member.id);
      expect(member.name)
        .toEqual(expected.member.name.toUpperCase());
    });

  });

});
