import { by, element, } from 'protractor';

export function getMessagesElements() {

  const messagesHeader = element(by.css('app-messages #header'))
  const messagesClearBtn = element(by.css('app-messages #clearBtn'));
  const messages = element.all(by.css('app-messages #messages-container'));

  return {
    messagesHeader,
    messagesClearBtn,
    messages,
  }
}
