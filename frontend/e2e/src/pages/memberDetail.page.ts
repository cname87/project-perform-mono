import { browser } from 'protractor';

import { getRootElements } from './elements/root.elements';
import { getMemberDetailElements } from './elements/memberDetail.element';
import { getMemberInputElements } from './elements/memberInput.element';
import { getMessagesElements } from './elements/messages.elements';

export function getMemberDetailPage() {

  /* navigate to a specific member detail page */
  const navigateToPage = async(id: number) => {
    await browser.get(`/members/:${id}`);
  }

  const rootElements = getRootElements();
  const memberDetailElements = getMemberDetailElements();
  const memberInputElements = getMemberInputElements();
  const messagesElement = getMessagesElements();

  return {
    navigateToPage,
    rootElements,
    memberDetailElements,
    memberInputElements,
    messagesElement,
  }
}
