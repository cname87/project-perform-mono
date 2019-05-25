import { browser } from 'protractor';

import { getRootElement } from './elements/root.element';
import { getPageNotFoundElement } from './elements/pageNotFound.element';
import { getMessagesElement } from './elements/messages.element';

export function getPageNotFoundPage() {

  /* the pageNotFound component appears in the routerLink just like the other links */

  /* navigate to the members list page */
  const navigateToPage = async() => {
    await browser.get('/nonexistentPage');
  }

  const rootElement = getRootElement();
  const pageNotFoundElement = getPageNotFoundElement();
  const messagesElement = getMessagesElement();

  return {
    navigateToPage,
    rootElement,
    pageNotFoundElement,
    messagesElement,
  }
}
