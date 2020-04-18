import { by, element } from 'protractor';

import { IMember } from 'src/app/data-providers/models/member';

export function getMemberDetailElements() {
  /* DOM elements */
  const tag = element(by.css('app-member-detail'));
  const header = element(by.css('mat-card-title'));
  const memberId = element(by.css('#memberId'));
  const memberName = element(by.css('#memberName'));
  const goBackBtn = element(by.css('#goBackBtn'));

  /* get member name from header */
  const getHeaderName = async (): Promise<string> => await header.getText();

  /* get the member object from the page */
  const getMember = async (): Promise<IMember> => {
    const _name = await memberName.getText();
    const _id = await memberId.getText();
    return {
      id: +_id.slice(4),
      name: _name.slice(6),
    };
  };

  return {
    tag,
    goBackBtn,
    getMember,
    getHeaderName,
  };
}
