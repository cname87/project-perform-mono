import { browser } from 'protractor';

import { getRootElement } from './elements/root.element';
import { getDashboardElement } from './elements/dashboard.element';
import { getMemberSearchElement } from './elements/memberSearch.element';
import { getMessagesElement } from './elements/messages.element';

/**
 * A get page function exists for each page:
 * - dashboard page containing app-root, app-dashboard, app-member-search and app-messages.
 * - members page containing app-root, app-members and app-messages.
 * - member detail page containing app-root, app-member-detail and app-messages.
 * - page not found page containing app-root and app-page-not-found.
 *
 * ElementFinders for all needed elements that appear on the page are exported below.
 *
 * The elements need to be on the DOM when an action is called, i.e. only call the get dashboard page function when the dashboard page is being displayed.
 *
 */

export function getDashboardPage() {

  /* navigate to the page */
  const navigateToPage = async() => {
    await browser.get('/dashboard');
  }

  const rootElement = getRootElement();
  const dashboardElement = getDashboardElement();
  const memberSearchElement = getMemberSearchElement();
  const messagesElement = getMessagesElement();

  return {
    navigateToPage,
    rootElement,
    dashboardElement,
    memberSearchElement,
    messagesElement,
  }
}
