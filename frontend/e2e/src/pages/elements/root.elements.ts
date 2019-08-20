import { getLoginElements } from './login.elements';
import { getNavElements } from './nav.elements';
import { getMessagesElements } from './messages.elements';

export function getRootElements() {

  const {
    bannerHeader,
    loginBtn,
    logoutBtn,
    profileBtn,
  } = getLoginElements();
  const {
    dashboardLink,
    membersLink,
    detailLink,
  } = getNavElements();
  const {
    messagesHeader,
    messagesClearBtn,
    messages,
  } = getMessagesElements();

  return {
    bannerHeader,
    loginBtn,
    logoutBtn,
    profileBtn,
    dashboardLink,
    membersLink,
    detailLink,
    messages,
    messagesHeader,
    messagesClearBtn,
  }
}
