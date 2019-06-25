import { by, element, } from 'protractor';

export function getErrorInformationElement() {

  /* DOM elements */
  const tag = element(by.css('app-error-information'));
  const header = element(by.css('mat-card-header mat-card-title'));
  const hint = element(by.css('mat-card-header mat-card-subtitle'));

  return {
    tag,
    header,
    hint,
  }
}
