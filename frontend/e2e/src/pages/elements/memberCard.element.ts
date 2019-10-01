import { by, element } from 'protractor';
/* returns all <app-cards> */
export function getMemberCardsElements() {
  /* DOM elements */
  const cardContent = element.all(by.css('[gdArea="content"]'));

  return {
    cardContent,
  };
}
