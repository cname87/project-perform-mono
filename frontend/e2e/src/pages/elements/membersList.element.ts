import { by, element, ElementFinder } from 'protractor';

import { IMember } from 'src/app/data-providers/models/member';

export function getMembersListElement() {
  /* DOM elements */
  const tag = element(by.css('app-members'));
  const list = element(by.css('app-members mat-nav-list'));
  const allListItems = element.all(by.css('app-members mat-list-item'));
  const allMemberIds = element.all(by.css('app-members #memberId'));
  const allMemberNames = element.all(by.css('app-members #memberName'));
  const allDeleteBtns = element.all(by.css('app-members #deleteBtn'));

  /**ng
   * Assumes member list page is displayed.
   * Selects a member from the members list page based on a supplied id.
   * @param id The id of the member to select - must correspond to a displayed member.
   */
  const selectMemberById = (id: number): { [key: string]: ElementFinder } => {
    let memberId = list.element(by.linkText(id.toString()));
    const memberListElement = memberId.element(by.xpath('..'));
    const memberName = memberListElement.element(by.css('#memberName'));
    const deleteButton = memberListElement.element(by.css('#deleteBtn'));
    return {
      memberId,
      memberName,
      deleteButton,
    };
  };

  /**
   * @returns An array of member objects corresponding to the list of displayed members.
   */
  async function getMembersArray(): Promise<IMember[]> {
    const fromListItem = async (li?: ElementFinder): Promise<IMember> => {
      const id = await li!.element(by.css('#memberId')).getText();
      const name = await li!.element(by.css('#memberName')).getText();
      return { id: +id, name };
    };

    let promisedMembers: IMember[] = await allListItems.map(fromListItem);
    return Promise.all(promisedMembers);
  }

  return {
    tag,
    allListItems,
    allMemberIds,
    allMemberNames,
    allDeleteBtns,
    selectMemberById,
    getMembersArray,
  };
}
