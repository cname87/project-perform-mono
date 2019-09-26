import { by, element, } from 'protractor';

export function getProgressBarElements() {

  const progressBar = element(by.css('mat-progress-bar'));

  return {
    progressBar,
  }
}
