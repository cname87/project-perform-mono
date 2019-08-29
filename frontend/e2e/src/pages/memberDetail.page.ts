import { browser } from 'protractor';

import { getRootElements } from './elements/root.elements';
import { getMemberDetailElement } from './elements/memberDetail.element';
import { getMemberInputElement } from './elements/memberInput.element';
import { getMessagesElements } from './elements/messages.elements';

export function getMemberDetailPage() {

  /* navigate to a specific member detail page */
  const navigateToPage = async(id: number) => {
    await browser.get(`/members/:${id}`);
  }

  const rootElements = getRootElements();
  const memberDetailElement = getMemberDetailElement();
  const memberInputElement = getMemberInputElement();
  const messagesElement = getMessagesElements();

  return {
    navigateToPage,
    rootElements,
    memberDetailElement,
    memberInputElement,
    messagesElement,
  }
}
