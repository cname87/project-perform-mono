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
  const header =  element(by.css('app-root mat-toolbar #header'));
  const navElements = element.all(by.css('app-root mat-toolbar a'));
  /* note only 1 nav link is displayed */
  const dashboardLink = navElements.get(0);
  const membersLink = navElements.get(0);

  return {
    tag,
    header,
    navElements,
    dashboardLink,
    membersLink,
  }
}
