import { browser } from 'protractor';

import { getRootElement } from './elements/root.element';
import { getErrorInformationElement } from './elements/errorInformation.element';
import { getMessagesElement } from './elements/messages.element';
import { getToastrElement } from './elements/toastr.element';

export function getErrorInformationPage() {

  /* the pageNotFound component appears in the routerLink just like the other links */

  /* navigate to the members list page */
  const navigateToPage = async() => {
    await browser.get('/nonexistentPage');
  }

  const rootElement = getRootElement();
  const errorInformationElement = getErrorInformationElement();
  const messagesElement = getMessagesElement();
  const toastrElement = getToastrElement();

  return {
    navigateToPage,
    rootElement,
    errorInformationElement,
    messagesElement,
    toastrElement,
  }
}
