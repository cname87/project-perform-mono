import { by, element, } from 'protractor';

export function getMessagesElement() {

  const messagesTag = element(by.css('app-messages'));
  const header = element(by.css('app-messages #header'))
  const clearBtn = element(by.css('app-messages #clearBtn'));
  const messages = element.all(by.css('app-messages #div2'));

  return {
    messagesTag,
    header,
    clearBtn,
    messages,
  }
}
