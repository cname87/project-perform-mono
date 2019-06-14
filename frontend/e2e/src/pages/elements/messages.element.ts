import { by, element, } from 'protractor';

export function getMessagesElement() {

  /* DOM elements */
  const tag = element(by.css('app-messages'));
  const header = element(by.css('app-messages #header'))
  const clearBtn = element(by.css('app-messages #clearBtn'));
  const messages = element.all(by.css('app-messages #messages-container'));

  return {
    tag,
    header,
    clearBtn,
    messages,
  }
}
