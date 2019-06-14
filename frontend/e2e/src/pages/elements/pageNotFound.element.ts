import { by, element, } from 'protractor';

export function getPageNotFoundElement() {

  /* DOM elements */
  const tag = element(by.css('app-page-not-found'));
  const header = element(by.css('app-page-not-found h1'));
  const hint = element(by.css('app-page-not-found h2'));

  return {
    tag,
    header,
    hint,
  }
}
