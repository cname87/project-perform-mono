import { by, element } from 'protractor';

export function getInformationElements() {
  const tag = element(by.css('app-information'));

  const header = tag.element(by.css('mat-card-header mat-card-title'));
  const hint = tag.element(by.css('mat-card-header mat-card-subtitle'));
  const goBackBtn = tag.element(by.css('#goBackBtn'));

  return {
    tag,
    header,
    hint,
    goBackBtn,
  };
}
