import { by, element, } from 'protractor';

export function getLoginElements() {

  const bannerHeader = element(by.css('app-login span.header'));
  const loginBtn = element(by.css('app-login #loginBtn'));
  const logoutBtn = element(by.css('app-login #logoutBtn'));
  const profileBtn = element(by.css('app-login #profileBtn'));

  return {
    bannerHeader,
    loginBtn,
    logoutBtn,
    profileBtn,
  }
}
