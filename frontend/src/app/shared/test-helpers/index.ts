import { DebugElement, Type } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export * from './async-observable-helpers';
export * from './activated-route-stub';
export * from './router-link-directive-stub';

// Short test utilities //

/**
 * Simulate a left mouse button element click.
 */
export function click(el: DebugElement | HTMLElement): void {
  if (el instanceof HTMLElement) {
    el.click();
  } else {
    el.triggerEventHandler('click', { button: 0 });
  }
}

/**
 * Simulate entering data in an <input> element.
 *
 * @param text: The text to enter in the <input>.
 * @param isAppend: Append the text if true. Replace input if false. Defaults to false.
 */
export function sendInput(
  fixture: ComponentFixture<any>,
  inputElement: HTMLInputElement,
  text: string,
  isAppend = false,
): Promise<any> {
  fixture.detectChanges();
  inputElement.value = isAppend ? inputElement.value + text : text;
  inputElement.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return fixture.whenStable();
}

/**
 * Find by CSS utilities for .spec files.
 */

/**
 * Use to find a html element that may or may not be present.
 * @param fixture component fixture.
 * @param css A valid css selector.
 * @returns HTMLElement or null if element not found.
 */
export function findCssOrNot<T>(
  fixture: ComponentFixture<any>,
  css: string,
): T | null {
  const element = fixture.debugElement.query(By.css(css));
  return element ? element.nativeElement : null;
}

/**
 * Use to find all html elements that may or may not be present.
 * @param fixture component fixture.
 * @param css A valid css selector.
 * @returns an array of HTMLElements or null if element not found.
 */
export function findAllCssOrNot<T>(
  fixture: ComponentFixture<any>,
  css: string,
): T[] | null {
  const elements = fixture.debugElement.queryAll(By.css(css));
  if (elements.length === 0) {
    return (null as unknown) as T[];
  }
  const htmlElements: T[] = [];
  for (const element of elements) {
    const htmlElement = element.nativeElement as T;
    htmlElements.push(htmlElement);
  }
  return htmlElements;
}

export function findId<T>(fixture: ComponentFixture<any>, id: string): T {
  const element = fixture.debugElement.query(By.css('#' + id));
  return element.nativeElement;
}

export function findTag<T>(fixture: ComponentFixture<any>, tag: string): T {
  const element = fixture.debugElement.query(By.css(tag));
  return element.nativeElement;
}
/* gets all the routerLink directive instances */
export function findRouterLinks<T>(
  fixture: ComponentFixture<any>,
  directive: Type<T>,
) {
  /* get the debugElements with an attached RouterLinkStubDirective */
  const routerLinksDes = fixture.debugElement.queryAll(By.directive(directive));
  /* each debugElement exposes a dependency injector with the specific instance of the directive attached to that element */
  return routerLinksDes.map((de) => de.injector.get<T>(directive as Type<T>));
}
