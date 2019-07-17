import { by, element, } from 'protractor';

export function getToastrElement() {

  /* DOM elements */
  const toastr = element(by.css('#toast-container'));
  const toastrTitle = element(by.css('.toast-title'));
  const toastrMessage = element(by.css('.toast-message'));
  return {
    toastr,
    toastrTitle,
    toastrMessage,
  }
}
