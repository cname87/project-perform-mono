import { browser } from 'protractor';

import { getRootElement } from './elements/root.element';
import { getErrorInformationElement } from './elements/errorInformation.element';
import { getMessagesElement } from './elements/messages.element';

export function getErrorInformationPage() {

  /* the pageNotFound component appears in the routerLink just like the other links */

  /* navigate to the members list page */
  const navigateToPage = async() => {
    await browser.get('/nonexistentPage');
  }

  const rootElement = getRootElement();
  const errorInformationElement = getErrorInformationElement();
  const messagesElement = getMessagesElement();

  return {
    navigateToPage,
    rootElement,
    errorInformationElement,
    messagesElement,
  }
}
