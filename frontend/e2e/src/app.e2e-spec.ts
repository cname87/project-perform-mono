import {
  browser,
  ElementFinder,
  by,
  ElementArrayFinder,
} from 'protractor';
import request from 'request-promise-native';
import fs from 'fs';
import path from 'path';
const certFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem')
const keyFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem')
const caFile = path.resolve(__dirname, '../certs/rootCA.crt')

import { getAppPageElements } from './app.page';
import { IMember } from 'src/app/api-members/api-members.service';
import { getDashboardPage }from './pages/dashboard.page';
import { getMemberDetailPage } from './pages/memberDetailPage';

class Member implements IMember {
  id: number = 0;
  name: string = '';

  /* get member from string formatted as '<id> <name>' */
  static fromString(s: string): Member {
    return {
      id: +s.substr(0, s.indexOf(' ')),
      name: s.substr(s.indexOf(' ') + 1),
    };
  }

  /* get member from member list <li> element */
  static async fromLi(li?: ElementFinder): Promise<Member> {
    let stringsFromA = await li!.all(by.css('a')).getText();  // TODO why all?
    let strings = stringsFromA[0].split(' ');
    return { id: +strings[0], name: strings[1] };
  }
}

describe('Project Perform', () => {

  /* set timeout here - set in beforeAll below */
  const timeout = 120000;
  const mockMembers = [
    { name: 'test11' },
    { name: 'test12' },
    { name: 'test13' },
    { name: 'test4' },
    { name: 'test5' },
  ]

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
    browser.get('/');
    browser.ignoreSynchronization = true;
    await browser.wait(() => {
      return browser.isElementPresent(by.css('app-root'));
    }, 5000);
    browser.ignoreSynchronization = false;
  }

  const testSetup = () => {
    const expected = {
      /* expected values */
      title: 'Team Members',
      header: 'Team Members',
      linkNames: ['Dashboard', 'Members'],
      numTopMembers: 4,
      topMemberIndex: 2,
      member: { id: 0, name: '' },
      nameSuffix: 'X',
      newName: '',
      numMembers: 5,
    }
    expected.member = {
       /* database empty => id will start at 1 */
      id: expected.topMemberIndex + 1,
      name: mockMembers[expected.topMemberIndex].name,
    }
    expected.newName
      = expected.member.name + expected.nameSuffix;
    const appPage = getAppPageElements();
    return {
      expected,
      appPage,
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
    const appPage = getAppPageElements();
    expect(await appPage.memberDetail
      .isPresent())
      .toBeTruthy('shows member detail');

    const member = await appPage
      .memberFromDetail(appPage.memberDetail);
    expect(member.id).toEqual(expected.member.id);
    expect(member.name)
      .toEqual(expected.member.name
      .toUpperCase());
  }

  async function getMemberInDetailView() {
    /* assumes that the current view is the member details view */
    let { appPage } = testSetup();
    expect(await appPage.memberDetail
      .isPresent())
      .toBeTruthy('shows member detail');
    return await appPage
      .memberFromDetail(appPage.memberDetail);
  }

  async function getMemberInMembersView() {
    let { appPage } = testSetup();
    const { expected: expectedValues } = testSetup();
    const { memberLink } = appPage
      .membersSelectMember(expectedValues.member.id);

    await memberLink.click();
    appPage = getAppPageElements();
    expect(await appPage.memberDetail
      .isPresent())
      .toBeTruthy('shows member detail');

    return await getMemberInDetailView();
  }

  async function toMemberArray(
    allMembers: ElementArrayFinder
  ): Promise<IMember[]> {
    let promisedMembers: Member[] = await allMembers.map(Member.fromLi);
    return Promise.all(promisedMembers);
  }

  let originalTimeout: number;
  beforeAll(async() => {
    /* check the 'test' database is in use - if not an error will be thrown */
    await (getAppPageElements()).isTestDatabase();
    /* set timeout to 2 min to allow for debug */
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  afterAll(async() => {
    /* delete all 'test' database members */
    await askServer('https://localhost:1337/members', 'DELETE');
    /* reset timeout */
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  })

  describe('has an initial page that', () => {

    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it('has expected title', async () => {
      const { expected } = testSetup();
      expect(await browser.getTitle()).toEqual(expected.title);
    });

    it('has expected header', async () => {
      const { expected } = testSetup();
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.rootElement.header
        .getText()).toEqual(expected.header);
    });

    it(`has expected links`, async () => {
      const { expected } = testSetup();
      const dashboardPage = getDashboardPage();
      const linkNames = await dashboardPage.rootElement.navElements
        .map((el?: ElementFinder) =>
          el!.getText(),
        );
      expect(linkNames).toEqual(expected.linkNames);
    });

    it('has dashboard as the active view', async () => {
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.dashboardElement.tag.isPresent()).toBeTruthy();
    });
  });

  describe('has dashboard & member detail pages that allow member names to be changed', () => {

    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it('has top members', async() => {
      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();
      const { expected } = testSetup();
      /* get the count of the members showing in the top members dashboard */
      const count = await dashboardPage.dashboardElement.topMembers.count();
      expect(count).toEqual(expected.numTopMembers);
    });

    it(`selects a member and routes to the members details view`, async() => {
      /* the dashboard page is still displayed */
      const { expected } = testSetup();
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.topMemberIndex);
    });

    it(`updates member name in members details input box`, async() => {
      /* the member detail page is now displayed */
      let memberDetailPage = getMemberDetailPage();
      const { expected } = testSetup();
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
      /* get the member from the member detail page */
      const member = await memberDetailPage.memberDetailElement.getMember();
      expect(member.id).toEqual(expected.member.id);
      expect(member.name)
        .toEqual(expected.newName.toUpperCase());
    });

    it(`cancels member detail name change and routes back to the dashboard view`, async () => {
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      const { expected }= testSetup();
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

    it(`selects a member and routes to the members details view`, async() => {
      /* the dashboard page is still displayed */
      const { expected } = testSetup();
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.topMemberIndex);
    });

    it(`updates member name in members details view input box`, async() => {
      /* the member detail page is now displayed */
      let memberDetailPage = getMemberDetailPage();
      const { expected } = testSetup();
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
      /* get the member from the member detail page */
      const member = await memberDetailPage.memberDetailElement.getMember();
      expect(member.id).toEqual(expected.member.id);
      expect(member.name)
        .toEqual(expected.newName.toUpperCase());
  });

    it(`saves and shows the new name in the dashboard view`, async () => {
      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();
      const { expected } = testSetup();
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

  describe('has a members page that', () => {
    /* set up database and load initial page */
    beforeAll(loadDbAndRootPage);

    it('switches to the members view', async () => {
      let { appPage } = testSetup();
      const { expected: expectedValues }= testSetup();
      /* click on members nav link */
      await appPage.membersHref().click();
      appPage = getAppPageElements();
      expect(await appPage.members.isPresent()).toBeTruthy();
      expect(await appPage.allMembers
        .count()).toEqual(
          expectedValues.numMembers,
         'number of members'
        );
    });

    it(`selects and routes back to the members details view`, async() => {
      const { expected: expectedValues } = testSetup();
      const member = await getMemberInMembersView();
      expect(member.id).toEqual(expectedValues.member.id);
      expect(member.name)
        .toEqual(expectedValues.member.name.toUpperCase());
    });

    it(`updates member name in members details view input box`, async() => {
      let { appPage } = testSetup();
      const { expected: expectedValues } = testSetup();
      await appPage.addToMemberName(expectedValues.nameSuffix);
      const member = await getMemberInDetailView();
      expect(member.id).toEqual(expectedValues.member.id);
      expect(member.name)
        .toEqual(expectedValues.newName.toUpperCase());
    });

    it(`shows member's name in members page list`, async () => {
      let { appPage } = testSetup();
      const { expected: expectedValues } = testSetup();
      /* click save which updates member name and returns to the members view */
      await appPage.save.click();
      appPage = getAppPageElements();
      expect(await appPage.members.isPresent()).toBeTruthy();

      let expectedText =
        `${expectedValues.member.id} ${expectedValues.newName}`;

      const { memberLink } = appPage
        .membersSelectMember(expectedValues.member.id);
      expect(await memberLink.getText()).toEqual(expectedText);
    });

    it(`deletes a member from the members view list`, async () => {
      let { appPage } = testSetup();
      const { expected: expectedValues } = testSetup();
      const membersBefore = await toMemberArray(appPage.allMembers);
      const { deleteButton } = await appPage
        .membersSelectMember(expectedValues.member.id);
      /* click 'delete' which deletes the member & stays on the members view */
      await deleteButton.click();
      appPage = getAppPageElements();
      expect(await appPage.members.isPresent()).toBeTruthy();

      expect(await appPage.allMembers.count()).toEqual(expectedValues.numMembers - 1 , 'number of members');
      const membersAfter = await toMemberArray(appPage.allMembers);
      const expectedMembers = membersBefore
        .filter((h) => h.name !== expectedValues.newName);
      expect(membersAfter).toEqual(expectedMembers);
    });

    it(`adds back deleted member`, async () => {
      const newMemberName = 'Alice';
      let { appPage } = testSetup();
      const membersBefore = await toMemberArray(appPage.allMembers);
      const numMembers = membersBefore.length;

      await appPage.membersInput.sendKeys(newMemberName);
      /* click on add which saves member and stays on members view */
      await appPage.membersAddButton.click();
      let page = getAppPageElements();
      expect(await appPage.members.isPresent()).toBeTruthy();

      let membersAfter = await toMemberArray(page.allMembers);
      expect(membersAfter.length).toEqual(numMembers + 1, 'number of members');

      expect(membersAfter.slice(0, numMembers)).toEqual(
        membersBefore,
        'old members are still there',
      );

      const maxId = membersBefore[membersBefore.length - 1].id;
      expect(membersAfter[numMembers]).toEqual({
        id: maxId + 1,
        name: newMemberName,
      });
    });

    it('displays correctly styled buttons', async () => {
      let { appPage } = testSetup();
      const deleteButtons = await appPage.membersDeleteButtons;

      for (const button of deleteButtons) {
        // Inherited styles from styles.css
        expect(await button.getCssValue('font-family')).toBe('Arial');
        expect(await button.getCssValue('border')).toContain('none');
        expect(await  button.getCssValue('padding')).toBe('5px 10px');
        expect(await button.getCssValue('border-radius')).toBe('4px');
        // Styles defined in members.component.css
        expect(await button.getCssValue('left')).toBe('194px');
        expect(await button.getCssValue('top')).toBe('-34px');
      }
      const addButton = appPage.membersAddButton;
      // Inherited styles from styles.css
      expect(await addButton.getCssValue('font-family')).toBe('Arial');
      expect(await addButton.getCssValue('border')).toContain('none');
      expect(await addButton.getCssValue('padding')).toBe('5px 10px');
      expect(await addButton.getCssValue('border-radius')).toBe('4px');
    });

  });

  describe('Progressive member search', () => {

    beforeAll(loadDbAndRootPage);

    it(`searches for 'test'`, async () => {
      const { appPage } = testSetup();
      await appPage.searchBox.sendKeys('test');
      browser.sleep(1000);
      expect(await appPage.searchResults.count()).toBe(5);
    });

    it(`continues search with '1'`, async () => {
      const { appPage } = testSetup();
      await appPage.searchBox.sendKeys('1');
      browser.sleep(1000);
      expect(await appPage.searchResults.count()).toBe(3);
    });

    it(`continues search with '3' and gets 1 member`, async () => {
      const { appPage } = testSetup();
      const { expected: expectedValues } = testSetup();
      await appPage.searchBox.sendKeys('3');
      browser.sleep(1000);
      expect(await appPage.searchResults.count()).toBe(1);
      let member = appPage.searchResults.get(0);
      expect(await member.getText()).toEqual(expectedValues.member.name);
    });

    it(`navigates to member details view`, async () => {
      let { appPage } = testSetup();
      const foundMember = appPage.searchResults.get(0);
      const { expected: expectedValues } = testSetup();
      expect(await foundMember.getText()).toEqual(expectedValues.member.name)

      await foundMember.click();
      appPage = getAppPageElements();
      expect(await appPage.membersDetailView
        .isPresent())
        .toBeTruthy('shows member detail view');

      const memberDetail = await getMemberInDetailView();
      expect(memberDetail.id).toEqual(expectedValues.member.id);
      expect(memberDetail.name)
        .toEqual(expectedValues.member.name.toUpperCase());
    });

  });

});
