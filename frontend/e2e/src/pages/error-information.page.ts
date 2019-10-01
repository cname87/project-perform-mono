import { browser } from 'protractor';

import { getRootElements } from './elements/root.elements';
import { getInformationElements } from './elements/information.elements';
import { getToastrElements } from './elements/toastr.elements';

export function getErrorInformationPage() {
  /* the pageNotFound component appears in the routerLink just like the other links */

  const navigateToPage = async () => {
    await browser.get('/nonexistentPage');
  };

  const rootElements = getRootElements();
  const errorInformationElements = getInformationElements();
  const toastrElement = getToastrElements();

  return {
    navigateToPage,
    rootElements,
    errorInformationElements,
    toastrElement,
  };
}
