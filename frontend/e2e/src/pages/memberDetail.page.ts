import { browser } from 'protractor';

import { getRootElement } from './elements/root.element';
import { getMemberDetailElement } from './elements/memberDetail.element';
import { getMessagesElement } from './elements/messages.element';

export function getMemberDetailPage() {

  /* navigate to a specific member detail page */
  const navigateToPage = async(id: number) => {
    await browser.get(`/members/:${id}`);
  }

  const rootElement = getRootElement();
  const memberDetailElement = getMemberDetailElement();
  const messagesElement = getMessagesElement();

  return {
    navigateToPage,
    rootElement,
    memberDetailElement,
    messagesElement,
  }
}
