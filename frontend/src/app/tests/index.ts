import { DebugElement } from '@angular/core';

export * from './async-observable-helpers';
export * from './activated-route-snapshot-stub';
export * from './router-link-directive-stub';
// export * from './jasmine-matchers';

//// Short utilities ////

/** MouseEvent.button property for click event objects */
export const ButtonClickEvents = {
  left: { button: 0 },
  right: { button: 2 },
};

/**
 * Simulate element click. Defaults to mouse left-button click event.
 */
export function click(
  el: DebugElement | HTMLElement,
  eventObj: any = ButtonClickEvents.left,
) {
  if (el instanceof HTMLElement) {
    el.click();
  } else {
    el.triggerEventHandler('click', eventObj);
  }
}
