import { browser, by, element, ElementFinder } from 'protractor';
import { IMember } from 'src/app/api-members/api-members.service';

export function getAppPageElements() {

  /* navigate to the root page */
  const navigateToPage = async() => {
    await browser.get('/');
  }

  /* select a member from the dashboard top members */
  const dashboardSelectMember = async(index: number) => {
    const selectedMemberElt = topMembers.get(index);
    const name = await selectedMemberElt.getText()
    return {
      selectedMemberElt,
      name,
    }
  }

  /* get member id and name from a given member detail element */
  const memberFromDetail = async(detail: ElementFinder): Promise<IMember> => {
    /* get member id from the first <div> */
    let _id = await detail.element(by.css('#memberId')).getText();
    /* get member name from the h2 */
    let _name = await detail.element(by.css('#memberName')).getText();
    return {
      id: +_id,
      name: _name.substr(0, _name.lastIndexOf(' ')),
    };
  }

  const addToMemberName = async(text: string): Promise<void> => {
    return await memberDetailInput.sendKeys(text);
  }
    /* Get ElementFinders for all needed elements that appear on the app page in its various forms.  The elements only need to be on the DOM when an action is called, i.e. only call a dashboard element, such as topMembers, when the dashboard component is being displayed on the app page. */
    const header =  element(by.css('app-root h1'));
    const navElements = element.all(by.css('app-root nav a'));
    const dashboardHref = navElements[0];
    const membersHref = navElements[1];
    const dashboard = element(by.css('app-root app-dashboard'));
    const topMembers = element.all(by.css('app-root app-dashboard > div h4'));
    const searchBox = element(by.css('#search-box'));
    const searchResults = element.all(by.css('.search-result li'));
    const members = element(by.css('app-root app-members'));
    const allMembers = element.all(by.css('app-root app-members li'));
    const memberDetail = element(by.css('app-root app-member-detail > div'));
    const memberDetailInput
      = element(by.css('app-root app-member-detail input'));
    const goBack
      =  element(by.css('app-root app-member-detail #goBackBtn'));

    return {
      navigateToPage,
      dashboardSelectMember,
      memberFromDetail,
      addToMemberName,
      header,
      navElements,
      dashboardHref,
      membersHref,
      dashboard,
      topMembers,
      searchBox,
      searchResults,
      members,
      allMembers,
      memberDetail,
      memberDetailInput,
      goBack,

    }
}
