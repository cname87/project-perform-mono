/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { browser, ElementFinder } from 'protractor';

import { getRootElements } from '../pages/elements/root.elements';
import { getDashboardPage } from '../pages/dashboard.page';
import { getMemberDetailPage } from '../pages/memberDetail.page';
import { getMembersListPage } from '../pages/membersList.page';
import { getErrorInformationPage } from '../pages/error-information.page';
import { getHelpers } from '../helpers/e2e-helpers';

describe('Project Perform', () => {
  const {
    mockMembers,
    loadRootPage,
    awaitElementVisible,
    awaitElementInvisible,
    originalTimeout,
    setTimeout,
    resetTimeout,
    resetDatabase,
    clearMessages,
    getMembersList,
    getDashboard,
    dashboardClickMember,
  } = getHelpers();

  const enum Save {
    False = 0,
    True = 1,
  }

  /* run before each 'it' function to supply local variables e.g. expected values for tests */
  const createExpected = () => {
    const expected = {
      /* expected values */
      title: 'Project Perform',
      header: 'Team Members',
      linkNames: ['MEMBERS DASHBOARD', 'MEMBERS LIST', 'MEMBER DETAIL'],
      numTopMembers: 4,
      selectedMemberIndex: 2,
      selectedMember: { id: 0, name: '' },
      foundMember: { id: 9, name: 'test118' },
      nameSuffix: 'X',
      newName: '',
      numMembers: Object.keys(mockMembers).length,
      numMessages1: 1,
      messageFetchedAll: 'MembersService: Fetched all members',
      numMessages2: 2,
      messageFetchedId: 'MembersService: Fetched member with id = ',
      numMessages3: 4,
      messageDeletedId: 'MembersService: Deleted member with id = ',
      messageUpdatedId: 'MembersService: Updated member with id = ',
      messageNotFound: 'PAGE NOT FOUND',
      messageClickAbove: 'Click on a tab link above',
      addedMemberName: 'Added',
      searchTest1: 8,
      searchTest11: 4,
      searchTest18: 1,
    };
    expected.selectedMember = {
      /* database empty => id will start at 1 */
      id: expected.selectedMemberIndex + 1,
      name: mockMembers[expected.selectedMemberIndex].name,
    };
    expected.newName = expected.selectedMember.name + expected.nameSuffix;
    expected.messageFetchedId += expected.selectedMember.id;
    expected.messageDeletedId += expected.selectedMember.id;
    expected.messageUpdatedId += expected.selectedMember.id;
    return {
      expected,
    };
  };

  /**
   * The members detail page must be being displayed when this is called.
   * Edits the member name in the members detail page.
   * The expected.nameSuffix is added to the existing member name.
   * @param: save: The save button if clicked if, and only if, the input parameter 'save' is true.
   */
  async function editNameInMemberDetails(
    suffix: string,
    save: Save = Save.True,
  ) {
    const { expected } = createExpected();

    /* the member detail page must be displayed */
    const memberDetailPage = getMemberDetailPage();

    /* confirm member detail page is being displayed */
    expect(
      await memberDetailPage.memberDetailElements.tag.isPresent(),
    ).toBeTruthy('shows member detail');
    /* get the member name displayed */
    const originalMember = await memberDetailPage.memberDetailElements.getMember();
    /* add a suffix to the name in the input field */
    await memberDetailPage.memberInputElements.inputBox.sendKeys(suffix);

    /* show the member card does not update to match the input text */
    const afterMember = await memberDetailPage.memberDetailElements.getMember();
    expect(originalMember.name).toEqual(afterMember.name);
    if (save) {
      /* clear messages list */
      await clearMessages();

      /* saves the new member name and routes back to the last page */
      await memberDetailPage.memberInputElements.actionBtn.click();

      /* await the appearance of the progress bar as should be loading from the database server */
      await awaitElementVisible(getRootElements().progressBar);
      /* await the disappearance of the progress bar */
      await awaitElementInvisible(getRootElements().progressBar);

      await awaitElementVisible(getRootElements().messagesClearBtn);

      /* wait until 2 new messages appear - updated and fetch all */
      await browser.wait(
        async () => (await getRootElements().messages.count()) === 2,
        5000,
      );

      /* get the first message (of tw0) */
      const message = await memberDetailPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(expected.messageUpdatedId);
    }
  }

  /**
   * The dashboard page must be being displayed when this is called.
   * Resets the member name in the members detail page.
   * The name is reset to the expected default member.
   */
  async function resetNameInMemberDetails(index: number) {
    const { expected } = createExpected();

    /* the dashboard page is displayed */
    /* click on a member and go to the member detail page */
    await dashboardClickMember(index);

    /* the member detail page is being displayed */
    const memberDetailPage = getMemberDetailPage();

    /* get the member name */
    const readMember = await memberDetailPage.memberDetailElements.getMember();
    /* clear input box */
    await memberDetailPage.memberInputElements.inputBox.clear();
    await browser.wait(
      async () =>
        (await memberDetailPage.memberInputElements.inputBox.getText()) === '',
      5000,
    );
    /* slice off the last character of the member name */
    await memberDetailPage.memberInputElements.inputBox.sendKeys(
      readMember.name.slice(0, -1),
    );
    /* saves the new member name and routes back to the dashboard page */
    await memberDetailPage.memberInputElements.actionBtn.click();

    /* the dashboard page is now displayed */
    const dashboardPage = getDashboardPage();

    await awaitElementVisible(dashboardPage.dashboardElements.tag);

    /* confirm name of member on dashboard has been updated */
    await browser.wait(
      async () =>
        (
          await dashboardPage.dashboardElements.selectMember(
            expected.selectedMemberIndex,
          )
        ).name === expected.selectedMember.name,
    );
  }

  /* Note: app must start in logged in state */

  beforeAll(async () => {
    /* test that test database is in use and reset it */
    await resetDatabase();
    setTimeout(120000);
  });

  afterAll(() => {
    resetTimeout(originalTimeout);
  });

  describe('has', () => {
    beforeAll(async () => {
      await loadRootPage();
    });

    it('the dashboard page as the start page', async () => {
      const dashboardPage = getDashboardPage();
      expect(
        await dashboardPage.dashboardElements.tag.isPresent(),
      ).toBeTruthy();
    });

    it('a web page with the expected title', async () => {
      const { expected } = createExpected();
      expect(await browser.getTitle()).toEqual(
        expected.title,
        'browser tab title',
      );
    });

    it('a dashboard page with the expected header', async () => {
      const { expected } = createExpected();
      const dashboardPage = getDashboardPage();
      expect(await dashboardPage.rootElements.bannerHeader.getText()).toEqual(
        expected.header,
        'banner header',
      );
    });

    it('a nav element with the expected links', async () => {
      const { expected } = createExpected();
      const dashboardPage = getDashboardPage();
      const linkNames = await dashboardPage.rootElements.navElements.map(
        (el?: ElementFinder) => el!.getText(),
      );
      expect(linkNames).toEqual(expected.linkNames as any, 'root links');
    });

    it('a dashboard page with top members displayed', async () => {
      const { expected } = createExpected();
      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();
      /* get the count of the members showing in the top members dashboard */
      const count = await dashboardPage.dashboardElements.topMembers.count();
      expect(count).toEqual(expected.numTopMembers, 'number of members');
    });

    it('a dashboard page with initial message displayed', async () => {
      const { expected } = createExpected();
      /* the dashboard page should still be displayed */
      const dashboardPage = getDashboardPage();
      /* get the messages showing in the message element */
      const count = await dashboardPage.rootElements.messages.count();
      expect(count).toEqual(expected.numMessages1, 'number of messages');
      const message = await dashboardPage.rootElements.messages
        .get(0)
        .getText();
      expect(message).toEqual(expected.messageFetchedAll);
    });

    it('a members list page with all members', async () => {
      const { expected } = createExpected();
      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
    });

    it('a members list page which displays correctly styled buttons', async () => {
      /* the member detail page is still displayed */
      const membersListPage = getMembersListPage();
      const deleteButtons = await membersListPage.memberListElements
        .allDeleteBtns;
      /* test all delete buttons */
      for (const button of deleteButtons) {
        /* 2 styles that material uses */
        expect(await button.getCssValue('border')).toContain('none');
        expect(await button.getCssValue('border-radius')).toBe('4px');
      }
    });

    it('a members list page with a link which routes back to the dashboard page', async () => {
      const { expected } = createExpected();
      /* click on members list link and pass in number of members expected */
      await getDashboard(expected.numTopMembers);
    });

    it('an error information / page not found page', async () => {
      const { expected } = createExpected();
      /* browse to a non-routed page */
      await browser.get('nonexistentPage');
      /* the error information page is displayed */
      const pageErrorInformationPage = getErrorInformationPage();

      /* wait until information card title is displayed */
      await awaitElementVisible(
        pageErrorInformationPage.errorInformationElements.header,
      );

      /* shows the error information page */
      expect(
        await pageErrorInformationPage.errorInformationElements.tag.isPresent(),
      ).toBeTruthy('shows error information - page not found page');

      /* wait the header and hint text */
      await browser.wait(
        async () =>
          (await pageErrorInformationPage.errorInformationElements.header.getText()) ===
          expected.messageNotFound,
        5000,
      );
      await browser.wait(
        async () =>
          (await pageErrorInformationPage.errorInformationElements.hint.getText()) ===
          expected.messageClickAbove,
        5000,
      );
    });
  });

  describe('has a dashboard & member detail page flow that', () => {
    beforeAll(async () => {
      await loadRootPage();
    });

    it('selects a member and routes to the members details page', async () => {
      const { expected } = createExpected();

      /* the dashboard page is displayed */
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.selectedMemberIndex);

      /* the member detail page is being displayed */
      const memberDetailPage = getMemberDetailPage();

      /* confirm header is showing member name */
      expect(
        await memberDetailPage.memberDetailElements.getHeaderName(),
      ).toEqual(expected.selectedMember.name.toUpperCase());
      /* confirm input is showing member name */
      expect(
        await memberDetailPage.memberInputElements.inputBox.getAttribute(
          'value',
        ),
      ).toEqual(expected.selectedMember.name);
    });

    it('has a member detail page that shows a message', async () => {
      const { expected } = createExpected();

      /* the member detail page is still displayed */
      const memberDetailPage = getMemberDetailPage();

      /* get the messages showing in the message element */
      const count = await memberDetailPage.rootElements.messages.count();
      expect(count).toEqual(expected.numMessages2, 'number of messages');
      const message = await memberDetailPage.rootElements.messages
        .get(count - 1)
        .getText();
      expect(message).toEqual(expected.messageFetchedId);
    });

    it('updates and saves a member name in members details page input box and routes back to the dashboard display and shows the new member name', async () => {
      const { expected } = createExpected();

      /* edit member name in member detail page and click save */
      await editNameInMemberDetails(expected.nameSuffix, Save.True);

      /* the dashboard page is now displayed */
      const dashboardPage = getDashboardPage();

      /* confirm dashboard page is being displayed */
      expect(await dashboardPage.dashboardElements.tag.isPresent()).toBeTruthy(
        'shows dashboard page',
      );
      /* confirm name of member on dashboard has been updated */
      const { name } = await dashboardPage.dashboardElements.selectMember(
        expected.selectedMemberIndex,
      );
      expect(name).toEqual(expected.newName);

      /* reset member name so next test starting fresh */
      await resetNameInMemberDetails(expected.selectedMemberIndex);
    });

    it('updates but cancels member detail name change and routes back to the dashboard page', async () => {
      const { expected } = createExpected();

      /* the dashboard page is now displayed */
      /* click on a member and go to the member detail page */
      await dashboardClickMember(expected.selectedMemberIndex);

      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();

      /* add a suffix to the name in the input field */
      await memberDetailPage.memberInputElements.inputBox.sendKeys(
        expected.nameSuffix,
      );

      /* click go back, which cancels name change and goes back to the dashboard page */
      await memberDetailPage.memberDetailElements.goBackBtn.click();

      /* the dashboard page is now displayed */
      const dashboardPage = getDashboardPage();

      /* await visibility of an element */
      await awaitElementVisible(dashboardPage.dashboardElements.tag);

      /* confirm name of member on dashboard has been updated */
      await browser.wait(
        async () =>
          (
            await dashboardPage.dashboardElements.selectMember(
              expected.selectedMemberIndex,
            )
          ).name === expected.selectedMember.name,
      );
    });
  });

  describe('has a members list and member detail page flow that', () => {
    beforeAll(async () => {
      await loadRootPage();
    });

    it('switches to the members list page', async () => {
      const { expected } = createExpected();
      /* click on members list link and pass in number of members expected */
      await getMembersList(expected.numMembers);
    });

    it('selects a member and routes to the members details view', async () => {
      const { expected } = createExpected();

      /* the members list page should still be displayed */
      const membersPage = getMembersListPage();

      /* get the link of the selected member */
      const { memberName } = membersPage.memberListElements.selectMemberById(
        expected.selectedMember.id,
      );
      /* click on the member which takes us to the member detail view */
      await memberName.click();

      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();

      await awaitElementVisible(memberDetailPage.memberDetailElements.tag);

      /* confirm member detail page is being displayed */
      await browser.wait(
        async () =>
          (await memberDetailPage.memberDetailElements.getMember()).id ===
          expected.selectedMember.id,
      );
      await browser.wait(
        async () =>
          (await memberDetailPage.memberDetailElements.getMember()).name ===
          expected.selectedMember.name,
      );
    });

    it('updates and saves a member name in members details page input box and routes back to members list which shows the updated name', async () => {
      const { expected } = createExpected();
      /* edit member name in member detail page and click save */
      await editNameInMemberDetails(expected.nameSuffix, Save.True);
      /* the members list page is now displayed */
      const membersListPage = getMembersListPage();
      await awaitElementVisible(membersListPage.memberListElements.tag);
    });

    it("shows the member's new name in the members list page", async () => {
      const { expected } = createExpected();

      /* the members list page is still displayed */
      const membersPage = getMembersListPage();

      /* confirm count of members displayed */
      expect(await membersPage.memberListElements.allMemberIds.count()).toEqual(
        expected.numMembers,
        'number of members',
      );
      /* confirm member id and member new name displayed */
      const {
        memberId,
        memberName,
      } = membersPage.memberListElements.selectMemberById(
        expected.selectedMember.id,
      );
      expect(+(await memberId.getText())).toBe(expected.selectedMember.id);
      expect(await memberName.getText()).toEqual(expected.newName);
    });

    it('deletes a member from the members list page', async () => {
      const { expected } = createExpected();

      /* the member list page is now displayed */
      const membersListPage = getMembersListPage();

      /* get the list of members */
      const membersBefore = await membersListPage.memberListElements.getMembersArray();
      const {
        deleteButton,
      } = membersListPage.memberListElements.selectMemberById(
        expected.selectedMember.id,
      );

      /* click 'delete' which deletes the member & stays on the members view */
      await deleteButton.click();

      /* await the appearance of the progress bar as should be loading from the database server */
      await awaitElementVisible(getRootElements().progressBar);
      /* await the disappearance of the progress bar */
      await awaitElementInvisible(getRootElements().progressBar);

      await awaitElementVisible(membersListPage.memberListElements.tag);

      /* confirm count of members displayed is down by one */
      await browser.wait(
        async () =>
          (await membersListPage.memberListElements.allMemberIds.count()) ===
          expected.numMembers - 1,
      );

      /* get the updated list of members */
      const membersAfter = await membersListPage.memberListElements.getMembersArray();
      /* filter deleted member for the members before array and compare */
      const expectedMembers = membersBefore.filter(
        (h) => h.name !== expected.newName,
      );
      expect(membersAfter).toEqual(expectedMembers);
    });

    it('shows a message', async () => {
      const { expected } = createExpected();

      /* the member list page is displayed */
      const membersListPage = getMembersListPage();

      /* get the messages showing in the message element */
      const count = await membersListPage.messagesElements.messages.count();
      expect(count).toEqual(expected.numMessages3, 'number of messages');
      const message = await membersListPage.messagesElements.messages
        .get(count - 2) // last message is the getMembers update
        .getText();
      expect(message).toEqual(expected.messageDeletedId);
    });

    it('clears the messages list', async () => {
      /* the member list page is displayed */
      const membersListPage = getMembersListPage();
      /* clear the messages list */
      await clearMessages();
      /* get the messages showing in the message element */
      const count = await membersListPage.messagesElements.messages.count();
      expect(count).toEqual(0, 'no messages');
    });

    it('adds a member on the members list page', async () => {
      const { expected } = createExpected();

      /* the members list page is still displayed */
      const membersListPage = getMembersListPage();

      /* get the list of members */
      const membersBefore = await membersListPage.memberListElements.getMembersArray();
      const numMembers = membersBefore.length;
      /* enter new name in input box */
      await membersListPage.memberInputElements.inputBox.sendKeys(
        expected.addedMemberName,
      );

      /* click on add which saves member and stays on members view */
      await membersListPage.memberInputElements.actionBtn.click();

      /* confirm added member is displayed */
      await browser.wait(
        async () =>
          (await membersListPage.memberListElements.getMembersArray())
            .length ===
          numMembers + 1,
      );

      /* slice last member of the new list and confirm previous list still there */
      const membersAfter = await membersListPage.memberListElements.getMembersArray();
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

    it('shows a message again', async () => {
      const { expected } = createExpected();

      /* the member list page is displayed */
      const membersListPage = getMembersListPage();

      /* get the messages showing in the message element */
      const count = await membersListPage.messagesElements.messages.count();
      expect(count).toEqual(2, 'two messages');
      const message = await membersListPage.messagesElements.messages
        .get(count - 1) // last message is the getMembers update
        .getText();
      expect(message).toEqual(expected.messageFetchedAll);
    });
  });

  describe('has a progressive member search that', () => {
    beforeAll(async () => {
      await loadRootPage();
    });

    it("searches for 'test1'", async () => {
      const { expected } = createExpected();

      /* the dashboard page should be displayed */
      const dashboardPage = getDashboardPage();

      expect(
        await dashboardPage.memberSearchElement.tag.isPresent(),
      ).toBeTruthy('shows member search box');

      /* enter 'text' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('test1');

      /* await the appearance of the progress bar as should be loading from the database server */
      await awaitElementVisible(getRootElements().progressBar);
      /* await the disappearance of the progress bar */
      await awaitElementInvisible(getRootElements().progressBar);

      await browser.wait(
        async () =>
          (await dashboardPage.memberSearchElement.searchResults.count()) ===
          expected.searchTest1,
        5000,
      );
    });

    it("continues search with '1'", async () => {
      const { expected } = createExpected();

      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();

      /* enter '1' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('1');

      await browser.wait(
        async () =>
          (await dashboardPage.memberSearchElement.searchResults.count()) ===
          expected.searchTest11,
        5000,
      );
    });

    it("continues search with '8' and gets 1 member", async () => {
      const { expected } = createExpected();

      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();

      /* enter '8' in search box */
      await dashboardPage.memberSearchElement.searchBox.sendKeys('8');
      await browser.wait(
        async () =>
          (await dashboardPage.memberSearchElement.searchResults.count()) ===
          expected.searchTest18,
      );
      /* confirm member found */
      const member = dashboardPage.memberSearchElement.searchResults.get(0);
      expect(await member.getText()).toEqual(expected.foundMember.name);
    });

    it('selects the found member and goes to the member details view', async () => {
      const { expected } = createExpected();

      /* the dashboard page is still displayed */
      const dashboardPage = getDashboardPage();

      /* get the sole found member */
      const foundMember = dashboardPage.memberSearchElement.searchResults.get(
        0,
      );
      expect(await foundMember.getText()).toEqual(expected.foundMember.name);

      /* click on the found member */
      await foundMember.click();

      /* the member detail page is now displayed */
      const memberDetailPage = getMemberDetailPage();

      await awaitElementVisible(memberDetailPage.memberDetailElements.tag);

      /* show the found member detail matches the expected member */
      await browser.wait(
        async () =>
          (await memberDetailPage.memberDetailElements.getMember()).id ===
          expected.foundMember.id,
      );
      await browser.wait(
        async () =>
          (await memberDetailPage.memberDetailElements.getMember()).name ===
          expected.foundMember.name,
      );
    });
  });
});
