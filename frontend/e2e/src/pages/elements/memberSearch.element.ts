import { by, element, } from 'protractor';

export function getMemberSearchElement() {

  const memberSearchTag = element(by.css('app-member-search'));
  const title = element(by.css('app-member-search #title'));
  const searchBox = element(by.css('app-member-search #search-box'));
  const searchResults = element.all(by.css('app-member-search #search-box li'));

  return {
    memberSearchTag,
    title,
    searchBox,
    searchResults,
  }
}
