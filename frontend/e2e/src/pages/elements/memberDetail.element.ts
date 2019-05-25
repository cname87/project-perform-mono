import { by, element } from 'protractor';

import { IMember } from 'src/app/api-members/model/member';

export function getMemberDetailElement() {

  /* DOM elements */
  const tag = element(by.css('app-member-detail'));
  const header = element(by.css('app-member-detail #memberName'));
  const memberId = element(by.css('app-member-detail #memberId'));
  const input
    = element(by.css('app-member-detail #nameInput'));
  const goBackBtn
    =  element(by.css('app-member-detail #goBackBtn'));
  const saveBtn
    =  element(by.css('app-member-detail #saveBtn'));

  /* get the member object from the page */
  const getMember = async(): Promise<IMember> => {
    let _id = await memberId.getText();
    let _name = await header.getText();
    return {
      id: +_id,
      name: _name.substr(0, _name.lastIndexOf(' ')),
    };
  }

  return {
    tag,
    header,
    memberId,
    input,
    goBackBtn,
    saveBtn,
    getMember,
  }
}
