import { browser } from 'protractor';

import { getRootElements } from './elements/root.elements';
import { getDashboardElements } from './elements/dashboard.elements';
import { getMemberSearchElement } from './elements/memberSearch.element';
import { getToastrElements } from './elements/toastr.elements';

export function getDashboardPage() {
  /* navigate to the page */
  const navigateToPage = async () => {
    await browser.get('/dashboard');
  };

  const rootElements = getRootElements();
  const dashboardElements = getDashboardElements();
  const memberSearchElement = getMemberSearchElement();
  const toastrElements = getToastrElements();

  return {
    navigateToPage,
    rootElements,
    dashboardElements,
    memberSearchElement,
    toastrElements,
  };
}
