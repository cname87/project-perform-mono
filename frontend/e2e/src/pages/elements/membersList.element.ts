import { by, element, ElementFinder } from 'protractor';
import { IMember } from 'src/app/api-members/model/member';

export function getMembersListElement() {

  /* DOM elements */
  const tag = element(by.css('app-members'));
  const allMembers = element.all(by.css('app-members li'));
  const deleteBtns = tag.all(by.buttonText('x'));
  const input = element(by.css('app-members #nameInput'));
  const addBtn = tag.element(by.buttonText('add'));

  /**
   * Assumes member list page is displayed.
   * Selects a member from the members list page based on a supplied id.
   * @param id The id of the member to select - must correspond to a displayed member.
   */
  const selectMemberById = (id: number): { [key: string]: ElementFinder } => {
    let spanWithId = element(by.cssContainingText('app-members li span.badge', id.toString()));
    const memberLink = spanWithId.element(by.xpath('..'));
    const memberListElement = spanWithId.element(by.xpath('../..'));
    const deleteButton = memberListElement.element(by.buttonText('x'));
    return {
      memberLink,
      deleteButton,
    }
  }

  /**
   * @returns An array of member objects corresponding to ing the list of displayed members.
   */
  async function getMembersArray(): Promise<IMember[]> {

    const fromLi = async(li?: ElementFinder): Promise<IMember> => {
      let stringsFromA = await li!.element(by.css('a')).getText();
      let strings = stringsFromA.split(' ');
      return { id: +strings[0], name: strings[1] };
    }

    let promisedMembers: IMember[] = await allMembers.map(await fromLi);
    return Promise.all(promisedMembers);
  }

  return {
    tag,
    allMembers,
    deleteBtns,
    input,
    addBtn,
    selectMemberById,
    getMembersArray,
  }
}
