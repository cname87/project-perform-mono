'use strict'; // necessary for es6 output in node

import {
  browser,
  element,
  by,
  ElementFinder,
  ElementArrayFinder,
} from 'protractor';
import { promise } from 'selenium-webdriver';

const expectedH1 = 'Team Members';
const expectedTitle = `${expectedH1}`;
const targetMember = { id: 15, name: 'Magneta' };
const targetMemberDashboardIndex = 3;
const nameSuffix = 'X';
const newMemberName = targetMember.name + nameSuffix;

class Member {
  id: number = 0;
  name: string = '';

  // Factory methods

  // Member from string formatted as '<id> <name>'.
  static fromString(s: string): Member {
    return {
      id: +s.substr(0, s.indexOf(' ')),
      name: s.substr(s.indexOf(' ') + 1),
    };
  }

  // Member from member list <li> element.
  static async fromLi(li?: ElementFinder): Promise<Member> {
    let stringsFromA = await li!.all(by.css('a')).getText();
    let strings = stringsFromA[0].split(' ');
    return { id: +strings[0], name: strings[1] };
  }

  // Member id and name from the given detail element.
  static async fromDetail(detail: ElementFinder): Promise<Member> {
    // Get member id from the first <div>
    let _id = await detail
      .all(by.css('div'))
      .first()
      .getText();
    // Get name from the h2
    let _name = await detail.element(by.css('h2')).getText();
    return {
      id: +_id.substr(_id.indexOf(' ') + 1),
      name: _name.substr(0, _name.lastIndexOf(' ')),
    };
  }
}

describe('Project Perform', () => {
  beforeAll(() => browser.get(''));

  function getPageElements() {
    let navElements = element.all(by.css('app-root nav a'));

    return {
      navElements: navElements,

      appDashboardHref: navElements.get(0),
      appDashboard: element(by.css('app-root app-dashboard')),
      topMembers: element.all(by.css('app-root app-dashboard > div h4')),

      appMembersHref: navElements.get(1),
      appMembers: element(by.css('app-root app-members')),
      allMembers: element.all(by.css('app-root app-members li')),
      selectedMemberSubview: element(
        by.css('app-root app-members > div:last-child'),
      ),

      memberDetail: element(by.css('app-root app-member-detail > div')),

      searchBox: element(by.css('#search-box')),
      searchResults: element.all(by.css('.search-result li')),
    };
  }

  describe('Initial page', async () => {
    it(`has title '${expectedTitle}'`, async () => {
      expect(await browser.getTitle()).toEqual(expectedTitle);
    });

    it(`has h1 '${expectedH1}'`, () => {
      expectHeading(1, expectedH1);
    });

    const expectedViewNames = ['Dashboard', 'Members'];
    it(`has views ${expectedViewNames}`, async () => {
      let viewNames = await getPageElements().navElements
      .map((el?: ElementFinder) =>
        el!.getText(),
      );
      expect(viewNames).toEqual(expectedViewNames);
    });

    it('has dashboard as the active view', () => {
      let page = getPageElements();
      expect(page.appDashboard.isPresent()).toBeTruthy();
    });
  });

  describe('Dashboard tests', () => {
    beforeAll(() => browser.get(''));

    it('has top members', async () => {
      const page = getPageElements();
      const count = await page.topMembers.count()
      expect(count).toEqual(4);
    });

    it(
      `selects and routes to ${targetMember.name} details`,
      dashboardSelectTargetMember,
    );

    it(
      `updates member name (${newMemberName}) in details view`,
      updateMemberNameInDetailView,
    );

    it(`cancels and shows ${targetMember.name} in Dashboard`, async () => {
      element(by.buttonText('go back')).click();
      browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      let targetMemberElt = await getPageElements().topMembers.get(
        targetMemberDashboardIndex,
      );
      expect(await targetMemberElt.getText()).toEqual(targetMember.name);
    });

    it(
      `selects and routes to ${targetMember.name} details`,
      dashboardSelectTargetMember,
    );

    it(
      `updates member name (${newMemberName}) in details view`,
      updateMemberNameInDetailView,
    );

    it(`saves and shows ${newMemberName} in Dashboard`, async () => {
      element(by.buttonText('save')).click();
      browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      let targetMemberElt = await getPageElements().topMembers.get(
        targetMemberDashboardIndex,
      );
      expect( await targetMemberElt.getText()).toEqual(newMemberName);
    });
  });

  describe('Members tests', () => {
    beforeAll(() => browser.get(''));

    it('can switch to Members view', async () => {
      getPageElements().appMembersHref.click();
      let page = getPageElements();
      expect(page.appMembers.isPresent()).toBeTruthy();
      expect(await page.allMembers.count()).toEqual(10, 'number of members');
    });

    it('can route to member details', async () => {
      getMemberLiEltById(targetMember.id).click();

      let page = getPageElements();
      expect(page.memberDetail.isPresent()).toBeTruthy('shows member detail');
      let member = await Member.fromDetail(page.memberDetail);
      expect(member.id).toEqual(targetMember.id);
      expect(member.name).toEqual(targetMember.name.toUpperCase());
    });

    it(
      `updates member name (${newMemberName}) in details view`,
      updateMemberNameInDetailView,
    );

    it(`shows ${newMemberName} in Members list`, async () => {
      element(by.buttonText('save')).click();
      browser.waitForAngular();
      let expectedText = `${targetMember.id} ${newMemberName}`;
      expect(await getMemberAEltById(targetMember.id).getText()).toEqual(expectedText);
    });

    it(`deletes ${newMemberName} from Members list`, async () => {
      const membersBefore = await toMemberArray(getPageElements().allMembers);
      const li = getMemberLiEltById(targetMember.id);
      li.element(by.buttonText('x')).click();

      const page = getPageElements();
      expect(page.appMembers.isPresent()).toBeTruthy();
      expect(await page.allMembers.count()).toEqual(9, 'number of members');
      const membersAfter = await toMemberArray(page.allMembers);
      // console.log(await Member.fromLi(page.allMembers[0]));
      const expectedMembers = membersBefore.filter((h) => h.name !== newMemberName);
      expect(membersAfter).toEqual(expectedMembers);
      // expect(page.selectedMemberSubview.isPresent()).toBeFalsy();
    });

    it(`adds back ${targetMember.name}`, async () => {
      const newMemberName = 'Alice';
      const membersBefore = await toMemberArray(getPageElements().allMembers);
      const numMembers = membersBefore.length;

      element(by.css('input')).sendKeys(newMemberName);
      element(by.buttonText('add')).click();

      let page = getPageElements();
      let membersAfter = await toMemberArray(page.allMembers);
      expect(membersAfter.length).toEqual(numMembers + 1, 'number of members');

      expect(membersAfter.slice(0, numMembers)).toEqual(
        membersBefore,
        'Old members are still there',
      );

      const maxId = membersBefore[membersBefore.length - 1].id;
      expect(membersAfter[numMembers]).toEqual({
        id: maxId + 1,
        name: newMemberName,
      });
    });

    it('displays correctly styled buttons', async () => {
      element.all(by.buttonText('x')).then((buttons) => {
        for (const button of buttons) {
          // Inherited styles from styles.css
          expect(button.getCssValue('font-family')).toBe('Arial');
          expect(button.getCssValue('border')).toContain('none');
          expect(button.getCssValue('padding')).toBe('5px 10px');
          expect(button.getCssValue('border-radius')).toBe('4px');
          // Styles defined in members.component.css
          expect(button.getCssValue('left')).toBe('194px');
          expect(button.getCssValue('top')).toBe('-32px');
        }
      });

      const addButton = element(by.buttonText('add'));
      // Inherited styles from styles.css
      expect(await addButton.getCssValue('font-family')).toBe('Arial');
      expect(addButton.getCssValue('border')).toContain('none');
      expect(await addButton.getCssValue('padding')).toBe('5px 10px');
      expect(await addButton.getCssValue('border-radius')).toBe('4px');
    });
  });

  describe('Progressive member search', () => {
    beforeAll(() => browser.get(''));

    it(`searches for 'Ma'`, async () => {
      getPageElements().searchBox.sendKeys('Ma');
      browser.sleep(1000);

      expect(await getPageElements().searchResults.count()).toBe(4);
    });

    it(`continues search with 'g'`, async () => {
      getPageElements().searchBox.sendKeys('g');
      browser.sleep(1000);
      expect(await getPageElements().searchResults.count()).toBe(2);
    });

    it(`continues search with 'e' and gets ${targetMember.name}`, async () => {
      getPageElements().searchBox.sendKeys('n');
      browser.sleep(1000);
      let page = getPageElements();
      expect(await page.searchResults.count()).toBe(1);
      let member = page.searchResults.get(0);
      expect(await member.getText()).toEqual(targetMember.name);
    });

    it(`navigates to ${targetMember.name} details view`, async () => {
      let member = getPageElements().searchResults.get(0);
      expect(await member.getText()).toEqual(targetMember.name);
      member.click();

      let page = getPageElements();
      expect(page.memberDetail.isPresent()).toBeTruthy('shows member detail');
      let member2 = await Member.fromDetail(page.memberDetail);
      expect(member2.id).toEqual(targetMember.id);
      expect(member2.name).toEqual(targetMember.name.toUpperCase());
    });
  });

  async function dashboardSelectTargetMember() {
    let targetMemberElt = getPageElements().topMembers.get(
      targetMemberDashboardIndex,
    );
    const name = await targetMemberElt.getText()
    expect(name).toEqual(targetMember.name);
    targetMemberElt.click();
    browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

    let page = getPageElements();
    expect(page.memberDetail.isPresent()).toBeTruthy('shows member detail');
    let member = await Member.fromDetail(page.memberDetail);
    expect(member.id).toEqual(targetMember.id);
    expect(member.name).toEqual(targetMember.name.toUpperCase());
  }

  async function updateMemberNameInDetailView() {
    // Assumes that the current view is the member details view.
    addToMemberName(nameSuffix);

    let page = getPageElements();
    let member = await Member.fromDetail(page.memberDetail);
    expect(member.id).toEqual(targetMember.id);
    expect(member.name).toEqual(newMemberName.toUpperCase());
  }
});

function addToMemberName(text: string): promise.Promise<void> {
  let input = element(by.css('input'));
  return input.sendKeys(text);
}

async function expectHeading(hLevel: number, expectedText: string): Promise<void> {
  let hTag = `h${hLevel}`;
  let hText = await element(by.css(hTag)).getText();
  expect(hText).toEqual(expectedText, hTag);
}

function getMemberAEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('..'));
}

function getMemberLiEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('../..'));
}

async function toMemberArray(allMembers: ElementArrayFinder): Promise<Member[]> {
  let promisedMembers = await allMembers.map(Member.fromLi);
  // The cast is necessary to get around issuing with the signature of Promise.all()
  return <Promise<any>>Promise.all(promisedMembers);
}
