import { browser } from 'protractor';

import { getRootElements } from './elements/root.elements';
import { getMembersListElement } from './elements/membersList.element';
import { getMemberInputElements } from './elements/memberInput.element';
import { getMessagesElements } from './elements/messages.elements';
import { getToastrElements } from './elements/toastr.elements';

export function getMembersListPage() {

  /* navigate to the members list page */
  const navigateToPage = async() => {
    await browser.get('/members');
  }

  const rootElements = getRootElements();
  const memberListElements = getMembersListElement();
  const memberInputElements = getMemberInputElements();
  const messagesElements = getMessagesElements();
  const toastrElements = getToastrElements();

  return {
    navigateToPage,
    rootElements,
    memberListElements,
    memberInputElements,
    messagesElements,
    toastrElements,
  }
}
