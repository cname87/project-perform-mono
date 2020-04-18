/**
 * Mock async observables that return asynchronously.
 * The observable either emits once and completes or errors.
 *
 * Must call `tick()` when testing with `fakeAsync()`.
 *
 * THE FOLLOWING DON'T WORK
 * .of() is a synchronous observable.
 * Using `of().delay()` triggers TestBed errors.
 * Using 'asap' scheduler - as in 'of(value, asap)' - doesn't work either.
 */

import { defer } from 'rxjs';

/**
 * Create async observable that emits-once and completes
 *  after a JS engine turn.
 */
export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}

/**
 * Create async observable error that errors
 *  after a JS engine turn.
 */
export function asyncError(errorObject: any) {
  return defer(() => Promise.reject(errorObject));
}
