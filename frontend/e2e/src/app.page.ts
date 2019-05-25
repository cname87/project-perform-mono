import { browser, by, element, ElementFinder } from 'protractor';
import { IMember } from 'src/app/api-members/api-members.service';

export function getAppPageElements() {

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

  /* navigate to the root page */
  const navigateToPage = async(path: string) => {
    await browser.get(path);
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

  function membersSelectMember(id: number): { [key: string]: ElementFinder } {
    let spanWithid = element(by.cssContainingText('li span.badge', id.toString()));
    const memberLink = spanWithid.element(by.xpath('..'));
    const listLink = spanWithid.element(by.xpath('../..'));
    const deleteButton = listLink.element(by.buttonText('x'));
    return {
      memberLink,
      deleteButton,
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
  const dashboardHref = async () => {
    return navElements.get(0);
  }
  const membersHref = () => {
    return navElements.get(1);
  }
  const dashboard = element(by.css('app-root app-dashboard'));
  const topMembers = element.all(by.css('app-root app-dashboard > div h4'));
  const searchBox = element(by.css('#search-box'));
  const searchResults = element.all(by.css('.search-result li'));
  const members = element(by.css('app-root app-members'));
  const membersInput = members.element(by.css('input'));
  const membersAddButton = members.element(by.buttonText('add'));
  const membersDeleteButtons = members.all(by.buttonText('x'));
  const allMembers = element.all(by.css('app-root app-members li'));
  const membersDetailView = element(by.css('app-root app-member-detail'));
  const memberDetail = element(by.css('app-root app-member-detail > div'));
  const memberDetailInput
    = element(by.css('app-root app-member-detail input'));
  const goBack
    =  element(by.css('app-root app-member-detail #goBackBtn'));
  const save
    =  element(by.css('app-root app-member-detail #saveBtn'));

  return {
    isTestDatabase,
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
    membersInput,
    membersAddButton,
    membersDeleteButtons,
    allMembers,
    membersSelectMember,
    membersDetailView,
    memberDetail,
    memberDetailInput,
    goBack,
    save,

  }
}
