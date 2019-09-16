import { by, element, } from 'protractor';

export function getNavElements() {

  const navElements = element.all(by.css('app-nav nav a'));
  const dashboardLink = navElements.get(0);
  const membersLink = navElements.get(1);
  const detailLink = navElements.get(2);

  return {
    navElements,
    dashboardLink,
    membersLink,
    detailLink,
  }
}

