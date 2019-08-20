import { by, element, } from 'protractor';

export function getInformationElements() {

  const header = element(by.css('app-information mat-card-header mat-card-title'));
  const hint = element(by.css('app-information mat-card-header mat-card-subtitle'));
  const goBackBtn = element(by.css('app-information #goBackBtn'));
  return {
    header,
    hint,
    goBackBtn,
  }
}
