import { browser } from 'protractor';

import { getRootElement } from './elements/root.element';
import { getMembersListElement } from './elements/membersList.element';
import { getMemberInputElement } from './elements/memberInput.element';
import { getMessagesElement } from './elements/messages.element';
import { getToastrElement } from './elements/toastr.element';

export function getMembersListPage() {

  /* navigate to the members list page */
  const navigateToPage = async() => {
    await browser.get('/members');
  }

  const rootElement = getRootElement();
  const memberListElement = getMembersListElement();
  const memberInputElement = getMemberInputElement();
  const messagesElement = getMessagesElement();
  const toastrElement = getToastrElement();

  return {
    navigateToPage,
    rootElement,
    memberListElement,
    memberInputElement,
    messagesElement,
    toastrElement,
  }
}
