import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export * from './async-observable-helpers';
export * from './activated-route-snapshot-stub';
export * from './router-link-directive-stub';

// Short utilities //

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

/**
 * Simulate entering data in an <input. element.
 * @params text: The text to enter in the <input>.
 */
export function sendInput(
  fixture: ComponentFixture<any>,
  inputElement: HTMLInputElement,
  text: string,
) {
  fixture.detectChanges();
  inputElement.value = text;
  inputElement.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return fixture.whenStable();
}

export function findId<T>(fixture: ComponentFixture<any>, id: string): T {
  const element = fixture.debugElement.query(By.css('#' + id));
  return element.nativeElement;
}

export function findTag<T>(fixture: ComponentFixture<any>, tag: string): T {
  const element = fixture.debugElement.query(By.css(tag));
  return element.nativeElement;
}

export function findAllTag(
  fixture: ComponentFixture<any>,
  tag: string,
): DebugElement[] {
  const DebugElements = fixture.debugElement.queryAll(By.css(tag));
  return DebugElements;
}
