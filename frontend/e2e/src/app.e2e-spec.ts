import {
  browser,
  // element,
  // by,
  ElementFinder,
  // ElementArrayFinder,
} from 'protractor';
// import { promise } from 'selenium-webdriver';


// import { IMember } from 'src/app/api-members/api-members.service';
import { getAppPageElements } from './app.page';
import { IMember } from 'src/app/api-members/model/member';

// const targetMemberDashboardIndex = 3;
// const nameSuffix = 'X';
// const newMemberName = targetMember.name + nameSuffix;

// class Member implements IMember {
//   id: number = 0;
//   name: string = '';

//   /* get member from string formatted as '<id> <name>' */
//   static fromString(s: string): Member {
//     return {
//       id: +s.substr(0, s.indexOf(' ')),
//       name: s.substr(s.indexOf(' ') + 1),
//     };
//   }

//   /* get member from member list <li> element */
//   static async fromLi(li?: ElementFinder): Promise<Member> {
//     let stringsFromA = await li!.all(by.css('a')).getText();  // TODO why all?
//     let strings = stringsFromA[0].split(' ');
//     return { id: +strings[0], name: strings[1] };
//   }
// }

interface IExpectedValues {
  /* expected values */
  expectedTitle: string,
  expectedHeader: string,
  expectedLinkNames: string[],
  expectedNumTopMembers: number,
  expectedMemberIndex: number,
  expectedMember: IMember,
  nameSuffix: string,
  expectedNewName: string,
}
describe('Project Perform', () => {
  const setup = async () => {
    const expectedValues = {
      /* expected values */
      expectedTitle: 'Team Members',
      expectedHeader: 'Team Members',
      expectedLinkNames: ['Dashboard', 'Members'],
      expectedNumTopMembers: 3,
      expectedMemberIndex: 2,
      expectedMember: { id: 7, name: 'XAlice' },
      nameSuffix: 'X',
      expectedNewName: '',
    }
    expectedValues.expectedNewName
    = expectedValues.expectedMember.name + expectedValues.nameSuffix;
    const appPage = getAppPageElements();
    await appPage.navigateToPage();
    return {
      expectedValues,
      appPage,
    }
  };

  async function updateMemberNameInDetailView(appPage: any, expectedValues: IExpectedValues) {
    /* assumes that the appPage current view is the member details view */
    await appPage.addToMemberName(expectedValues.nameSuffix);
    // await appPage.memberDetailInput.sendKeys(expectedValues.nameSuffix);
    expect(await appPage.memberDetail
      .isPresent())
      .toBeTruthy('shows member detail');
    const member = await appPage
      .memberFromDetail(appPage.memberDetail);
    expect(member.id).toEqual(expectedValues.expectedMember.id);
    expect(member.name)
      .toEqual(expectedValues.expectedNewName.toUpperCase());
    }
  describe('has an initial page that', async () => {

    it('has expected title', async () => {
      const { expectedValues } = await setup();
      expect(await browser.getTitle()).toEqual(expectedValues.expectedTitle);
    });

    it('has expected header', async () => {
      const { expectedValues, appPage } = await setup();
      expect(await appPage.header.getText()).toEqual(expectedValues.expectedHeader);
    });


    it(`has expected links`, async () => {
      const { expectedValues, appPage } = await setup();
      const linkNames = await appPage.navElements
        .map((el?: ElementFinder) =>
          el!.getText(),
        );
      expect(linkNames).toEqual(expectedValues.expectedLinkNames);
    });

    it('has dashboard as the active view', async () => {
      const { appPage } = await setup();
      expect(appPage.dashboard.isPresent()).toBeTruthy();
    });
  });

  describe('has a dashboard page that', () => {

    it('has top members', async () => {
      const { expectedValues, appPage } = await setup();
      const count = await appPage.topMembers.count()
      expect(count).toEqual(expectedValues.expectedNumTopMembers);
    });

    it(`selects and routes to a member's details`, async () => {
        const { expectedValues, appPage } = await setup();
        const { selectedMemberElt, name } = await appPage
          .dashboardSelectMember(expectedValues.expectedMemberIndex);
        expect(name).toEqual(expectedValues.expectedMember.name);

        await selectedMemberElt.click();
        const appPageRefreshed = getAppPageElements();

        expect(await appPageRefreshed.memberDetail
          .isPresent())
          .toBeTruthy('shows member detail');
        const member = await appPageRefreshed
          .memberFromDetail(appPageRefreshed.memberDetail);
        expect(member.id).toEqual(expectedValues.expectedMember.id);
        expect(member.name)
          .toEqual(expectedValues.expectedMember.name
          .toUpperCase());
      }
    );

    it(
      `updates member name in details view`, async () => {
        const { expectedValues, appPage } = await setup();
        const { selectedMemberElt } = await appPage
          .dashboardSelectMember(expectedValues.expectedMemberIndex);
        await selectedMemberElt.click();
        const appPageRefreshed = getAppPageElements();
        await updateMemberNameInDetailView(appPageRefreshed, expectedValues);
      });

    it(`cancels member detail name change`, async () => {
      const { expectedValues, appPage } = await setup();
      let { selectedMemberElt, name } = await appPage
        .dashboardSelectMember(expectedValues.expectedMemberIndex);
      expect(name).toEqual(expectedValues.expectedMember.name);

      await selectedMemberElt.click();
      let appPageRefreshed = getAppPageElements();

      /* click go back before you save i.e. cancel */
      await appPageRefreshed.goBack.click();
      appPageRefreshed = getAppPageElements();
      expect(await selectedMemberElt
        .getText())
        .toEqual(expectedValues.expectedMember.name);
    });

    // it(
    //   `selects and routes to ${targetMember.name} details`,
    //   dashboardSelectTargetMember,
    // );

    // it(
    //   `updates member name (${newMemberName}) in details view`,
    //   updateMemberNameInDetailView,
    // );

    // it(`saves and shows ${newMemberName} in Dashboard`, async () => {
    //   element(by.buttonText('save')).click();
    //   browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

    //   let selectedMemberElt = await getPageElements().topMembers.get(
    //     targetMemberDashboardIndex,
    //   );
    //   expect( await selectedMemberElt.getText()).toEqual(newMemberName);
    // });
  });

});
  // describe('Members tests', () => {
  //   beforeAll(() => browser.get(''));

  //   it('can switch to Members view', async () => {
  //     getPageElements().appMembersHref.click();
  //     let page = getPageElements();
  //     expect(page.appMembers.isPresent()).toBeTruthy();
  //     expect(await page.allMembers.count()).toEqual(10, 'number of members');
  //   });

  //   it('can route to member details', async () => {
  //     getMemberLiEltById(targetMember.id).click();

  //     let page = getPageElements();
  //     expect(page.memberDetail.isPresent()).toBeTruthy('shows member detail');
  //     let member = await Member.fromDetail(page.memberDetail);
  //     expect(member.id).toEqual(targetMember.id);
  //     expect(member.name).toEqual(targetMember.name.toUpperCase());
  //   });

  //   it(
  //     `updates member name (${newMemberName}) in details view`,
  //     updateMemberNameInDetailView,
  //   );

  //   it(`shows ${newMemberName} in Members list`, async () => {
  //     element(by.buttonText('save')).click();
  //     browser.waitForAngular();
  //     let expectedText = `${targetMember.id} ${newMemberName}`;
  //     expect(await getMemberAEltById(targetMember.id).getText()).toEqual(expectedText);
  //   });

  //   it(`deletes ${newMemberName} from Members list`, async () => {
  //     const membersBefore = await toMemberArray(getPageElements().allMembers);
  //     const li = getMemberLiEltById(targetMember.id);
  //     li.element(by.buttonText('x')).click();

  //     const page = getPageElements();
  //     expect(page.appMembers.isPresent()).toBeTruthy();
  //     expect(await page.allMembers.count()).toEqual(9, 'number of members');
  //     const membersAfter = await toMemberArray(page.allMembers);
  //     // console.log(await Member.fromLi(page.allMembers[0]));
  //     const expectedMembers = membersBefore.filter((h) => h.name !== newMemberName);
  //     expect(membersAfter).toEqual(expectedMembers);
  //   });

  //   it(`adds back ${targetMember.name}`, async () => {
  //     const newMemberName = 'Alice';
  //     const membersBefore = await toMemberArray(getPageElements().allMembers);
  //     const numMembers = membersBefore.length;

  //     element(by.css('input')).sendKeys(newMemberName);
  //     element(by.buttonText('add')).click();

  //     let page = getPageElements();
  //     let membersAfter = await toMemberArray(page.allMembers);
  //     expect(membersAfter.length).toEqual(numMembers + 1, 'number of members');

  //     expect(membersAfter.slice(0, numMembers)).toEqual(
  //       membersBefore,
  //       'Old members are still there',
  //     );

  //     const maxId = membersBefore[membersBefore.length - 1].id;
  //     expect(membersAfter[numMembers]).toEqual({
  //       id: maxId + 1,
  //       name: newMemberName,
  //     });
  //   });

  //   it('displays correctly styled buttons', async () => {
  //     element.all(by.buttonText('x')).then((buttons) => {
  //       for (const button of buttons) {
  //         // Inherited styles from styles.css
  //         expect(button.getCssValue('font-family')).toBe('Arial');
  //         expect(button.getCssValue('border')).toContain('none');
  //         expect(button.getCssValue('padding')).toBe('5px 10px');
  //         expect(button.getCssValue('border-radius')).toBe('4px');
  //         // Styles defined in members.component.css
  //         expect(button.getCssValue('left')).toBe('194px');
  //         expect(button.getCssValue('top')).toBe('-32px');
  //       }
  //     });

  //     const addButton = element(by.buttonText('add'));
  //     // Inherited styles from styles.css
  //     expect(await addButton.getCssValue('font-family')).toBe('Arial');
  //     expect(addButton.getCssValue('border')).toContain('none');
  //     expect(await addButton.getCssValue('padding')).toBe('5px 10px');
  //     expect(await addButton.getCssValue('border-radius')).toBe('4px');
  //   });
  // });

  // describe('Progressive member search', () => {
  //   beforeAll(() => browser.get(''));

  //   it(`searches for 'Ma'`, async () => {
  //     getPageElements().searchBox.sendKeys('Ma');
  //     browser.sleep(1000);

  //     expect(await getPageElements().searchResults.count()).toBe(4);
  //   });

  //   it(`continues search with 'g'`, async () => {
  //     getPageElements().searchBox.sendKeys('g');
  //     browser.sleep(1000);
  //     expect(await getPageElements().searchResults.count()).toBe(2);
  //   });

  //   it(`continues search with 'e' and gets ${targetMember.name}`, async () => {
  //     getPageElements().searchBox.sendKeys('n');
  //     browser.sleep(1000);
  //     let page = getPageElements();
  //     expect(await page.searchResults.count()).toBe(1);
  //     let member = page.searchResults.get(0);
  //     expect(await member.getText()).toEqual(targetMember.name);
  //   });

  //   it(`navigates to ${targetMember.name} details view`, async () => {
  //     let member = getPageElements().searchResults.get(0);
  //     expect(await member.getText()).toEqual(targetMember.name);
  //     member.click();

  //     let page = getPageElements();
  //     expect(page.memberDetail.isPresent()).toBeTruthy('shows member detail');
  //     let member2 = await Member.fromDetail(page.memberDetail);
  //     expect(member2.id).toEqual(targetMember.id);
  //     expect(member2.name).toEqual(targetMember.name.toUpperCase());
  //   });
  // });

//   async function dashboardSelectTargetMember() {
//     let selectedMemberElt = getPageElements().topMembers.get(
//       targetMemberDashboardIndex,
//     );
//     const name = await selectedMemberElt.getText()
//     expect(name).toEqual(targetMember.name);
//     selectedMemberElt.click();
//     browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

//     let page = getPageElements();
//     expect(page.memberDetail.isPresent()).toBeTruthy('shows member detail');
//     let member = await Member.fromDetail(page.memberDetail);
//     expect(member.id).toEqual(targetMember.id);
//     expect(member.name).toEqual(targetMember.name.toUpperCase());
//   }


// });



// async function expectHeading(hLevel: number, expectedText: string): Promise<void> {
//   let hTag = `h${hLevel}`;
//   let hText = await element(by.css(hTag)).getText();
//   expect(hText).toEqual(expectedText, hTag);
// }

// function getMemberAEltById(id: number): ElementFinder {
//   let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
//   return spanForId.element(by.xpath('..'));
// }

// function getMemberLiEltById(id: number): ElementFinder {
//   let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
//   return spanForId.element(by.xpath('../..'));
// }

// async function toMemberArray(allMembers: ElementArrayFinder): Promise<Member[]> {
//   let promisedMembers = await allMembers.map(Member.fromLi);
//   // The cast is necessary to get around issuing with the signature of Promise.all()
//   return <Promise<any>>Promise.all(promisedMembers);
// }
