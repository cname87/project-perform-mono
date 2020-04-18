import { by, element } from 'protractor';

export function getMemberSearchElement() {
  /* DOM elements */
  const tag = element(by.css('app-member-search'));
  const searchBox = element(by.css('app-member-search #search-box'));
  const searchResults = element.all(by.css('app-member-search mat-nav-list a'));
  const hint = element(by.css('app-member-search mat-hint'));

  return {
    tag,
    searchBox,
    searchResults,
    hint,
  };
}
