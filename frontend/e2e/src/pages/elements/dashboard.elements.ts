import { by, element } from 'protractor';
import { getMemberCardsElements } from './memberCard.element';

const memberCardsElements = getMemberCardsElements();

export function getDashboardElements() {
  const tag = element(by.css('app-dashboard'));
  const topMembers = element.all(by.css('app-dashboard a'));

  /* select a member from the dashboard top members */
  const selectMember = async (index: number) => {
    const link = topMembers.get(index);
    const content = memberCardsElements.cardContent.get(index);
    const name = (await content.getText()).slice('Name: '.length);
    return {
      link,
      name,
    };
  };

  return {
    tag,
    topMembers,
    selectMember,
  };
}
