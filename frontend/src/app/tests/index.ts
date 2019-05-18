import { DebugElement } from '@angular/core';

export * from './async-observable-helpers';
export * from './activated-route-snapshot-stub';
export * from './router-link-directive-stub';

//// Short utilities ////

/**
 * Simulate a left mouse button element click.
 */
export function click(el: DebugElement | HTMLElement) {
  if (el instanceof HTMLElement) {
    el.click();
  } else {
    el.triggerEventHandler('click', { button: 0 });
  }
}
