import { by, element, } from 'protractor';

/**
 * A get component function exists for each component.
 *
 * ElementFinders for all needed elements that appear on the component are exported.
 *
 * The elements need to be on the DOM when an action is called, i.e. only call the get component function when that component is being displayed.
 *
 */

export function getRootElement() {

  /* DOM elements */
  const tag = element(by.css('app-root'));
  const header =  element(by.css('app-root .mat-display-1'));
  const navElements = element.all(by.css('app-root .mat-tab-nav-bar a'));
  const dashboardLink = navElements.get(0);
  const membersLink = navElements.get(1);
  const detailLink = navElements.get(2);

  return {
    tag,
    header,
    navElements,
    dashboardLink,
    membersLink,
    detailLink,
  }
}
