import { by, element, } from 'protractor';

export function getUserProfileElements() {

  const title = element(by.css('app-profile mat-card-header mat-card-title'));
  const subtitle = element(by.css('app-profile mat-card-header mat-card-subtitle'));
  const profileName = element(by.css('app-profile #profileName'));
  const profileEmail = element(by.css('app-profile #profileEmail'));
  const goBackBtn = element(by.css('app-profile #goBackBtn'));

  return {
    title,
    subtitle,
    profileName,
    profileEmail,
    goBackBtn,
  }
}
