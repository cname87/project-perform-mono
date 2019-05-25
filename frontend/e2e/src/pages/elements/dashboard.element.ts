import { by, element, } from 'protractor';

export function getDashboardElement() {

  /* select a member from the dashboard top members */
  const selectMember = async(index: number) => {
    const link = topMembers.get(index); // click on  link will bubble to <a>
    const name = await link.getText()
    return {
      link,
      name,
    }
  }

  const tag = element(by.css('app-dashboard'));
  const title = element(by.css('app-dashboard #title'))
  const topMembers = element.all(by.css('app-dashboard #m'));
  const memberSearchTag = element(by.css('app-dashboard app-member-search'));

  return {
    selectMember,
    tag,
    title,
    topMembers,
    memberSearchTag,
  }
}
