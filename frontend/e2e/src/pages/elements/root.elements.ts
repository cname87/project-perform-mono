import { getLoginElements } from './login.elements';
import { getNavElements } from './nav.elements';
import { getMessagesElements } from './messages.elements';
import { getToastrElements } from './toastr.elements';

export function getRootElements() {

  const {
    bannerHeader,
    loginBtn,
    logoutBtn,
    profileBtn,
  } = getLoginElements();
  const {
    navElements,
    dashboardLink,
    membersLink,
    detailLink,
  } = getNavElements();
  const {
    messagesHeader,
    messagesClearBtn,
    messages,
  } = getMessagesElements();

  const {
    toastr,
    toastrTitle,
    toastrMessage,
  } = getToastrElements();

  return {
    bannerHeader,
    loginBtn,
    logoutBtn,
    profileBtn,
    navElements,
    dashboardLink,
    membersLink,
    detailLink,
    messages,
    messagesHeader,
    messagesClearBtn,
    toastr,
    toastrTitle,
    toastrMessage,
  }
}
