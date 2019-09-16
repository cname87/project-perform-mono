import { by, element, } from 'protractor';

export function getMemberInputElements() {

  /* DOM elements */
  const tag = element(by.css('app-member-input'));
  const inputBox = element(by.css('#inputBox'));
  const label = element(by.css('mat-label'));
  const actionBtn = element(by.css('#actionBtn'))
  const icon = element(by.css('mat-icon'));
  const hint = element(by.css('mat-hint'));

  return {
    tag,
    inputBox,
    label,
    actionBtn,
    icon,
    hint,
  }
}
