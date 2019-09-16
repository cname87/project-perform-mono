import { browser } from 'protractor';

import { getRootElements } from './elements/root.elements';
import { getInformationElements } from './elements/information.elements';
import { getToastrElements } from './elements/toastr.elements';


export function getLoginPage() {

  const navigateToPage = async() => {
    await browser.get('/');
  }

  const rootElements = getRootElements();
  const loginInformationElement = getInformationElements();
  const toastrElement = getToastrElements();

  return {
    navigateToPage,
    rootElements,
    loginInformationElement,
    toastrElement,
  }
}
