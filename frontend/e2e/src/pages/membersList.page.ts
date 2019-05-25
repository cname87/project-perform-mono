import { browser } from 'protractor';

import { getRootElement } from './elements/root.element';
import { getMembersListElement } from './elements/membersList.element';
import { getMessagesElement } from './elements/messages.element';

export function getMembersListPage() {

  /* navigate to the members list page */
  const navigateToPage = async() => {
    await browser.get('/members');
  }

  const rootElement = getRootElement();
  const memberListElement = getMembersListElement();
  const messagesElement = getMessagesElement();

  return {
    navigateToPage,
    rootElement,
    memberListElement,
    messagesElement,
  }
}
