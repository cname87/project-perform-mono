import { by, element, ElementFinder } from 'protractor';
import { IMember } from 'src/app/api/model/member';

export function getMembersListElement() {

  /* DOM elements */
  const tag = element(by.css('app-members'));
  const list = element(by.css('mat-nav-list'));
  const allListItems = element.all(by.css('mat-list-item'));
  const allMemberIds = element.all(by.css('#memberId'));
  const allMemberNames = element.all(by.css('#memberName'));
  const allDeleteBtns = tag.all(by.css('#deleteBtn'));

  /**
   * Assumes member list page is displayed.
   * Selects a member from the members list page based on a supplied id.
   * @param id The id of the member to select - must correspond to a displayed member.
   */
  const selectMemberById = (id: number): { [key: string]: ElementFinder } => {
    let memberId = list.element(by.linkText(id.toString()));
    const memberListElement = memberId.element(by.xpath('..'));
    const memberName =  memberListElement.element(by.css('#memberName'));
    const deleteButton = memberListElement.element(by.css('#deleteBtn'));
    return {
      memberId,
      memberName,
      deleteButton,
    }
  }

  /**
   * @returns An array of member objects corresponding to the list of displayed members.
   */
  async function getMembersArray(): Promise<IMember[]> {

    const fromListItem = async(li?: ElementFinder): Promise<IMember> => {
      const id = await li!.element(by.css('#memberId')).getText();
      const name = await li!.element(by.css('#memberName')).getText();
      return { id: +id, name };
    }

    let promisedMembers: IMember[] = await allListItems.map(await fromListItem);
    return Promise.all(promisedMembers);
  }

  async function debugPrint() {

    console.log('allListItems: ' + await allListItems.count());
    console.log('allMemberIds: ' + await allMemberIds.count());
    console.log('allMemberNames: ' + await allMemberNames.count());

  }

  /* comment out by default */
  // debugPrint()

  return {
    tag,
    allListItems,
    allMemberIds,
    allMemberNames,
    allDeleteBtns,
    selectMemberById,
    getMembersArray,
    debugPrint,
  }
}
