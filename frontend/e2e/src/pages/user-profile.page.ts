import { browser } from 'protractor';

import { getRootElements } from './elements/root.elements';
import { getUserProfileElements } from './elements/profile.elements';

export function getUserProfilePage() {

  const navigateToPage = async() => {
    await browser.get('/profile');
  }

  const rootElements = getRootElements();
  const userProfileElements = getUserProfileElements();

  return {
    navigateToPage,
    rootElements,
    userProfileElements,
  }
}
