import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { HttpErrorInterceptor } from './http-error.interceptor';
import { of, throwError, defer } from 'rxjs';

interface INgxLoggerSpy {
  trace: jasmine.Spy;
  error: jasmine.Spy;
}

describe('HttpErrorInterceptor', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spies to be injected */
    const ngxLoggerSpy = jasmine.createSpyObj('ngxLogger', ['trace', 'error']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        HttpErrorInterceptor,
        { provide: NGXLogger, useValue: ngxLoggerSpy },
      ],
    }).compileComponents();
  }

  /**
   * List all expected 'magic' values here to be used in tests.
   */
  function expected() {
    const noError = 'No error';

    const errorEvent = new ErrorEvent('Test errorEvent');
    const clientError = {
      allocatedType: 'Http server-side',
      error: errorEvent,
    };

    const serverError = {
      allocatedType: 'Http server-side',
      message: 'Server error message',
      status: 'Error status',
      error: 'Error property in test error',
    };

    let tryNumber = 0;

    const nextFactory = () => {
      return tryNumber++ ? of(noError) : throwError(serverError);
    };

    const traceCallsExErrors = 3;

    return {
      totalTries: 3,
      retryDelay: 500,
      requestUrl: {
        url: 'testUrl',
      },
      next: {
        handle: () => of(noError),
      },
      nextServerError: {
        handle: () => throwError(serverError),
      },
      nextClientError: {
        handle: () => throwError(clientError),
      },
      nextOneError: {
        handle: () => defer(nextFactory),
      },
      noError,
      serverError,
      clientError,
      traceCallsExErrors,
    };
  }

  function createSpies(ngxLoggerSpy: INgxLoggerSpy) {
    const traceLoggerSpy = ngxLoggerSpy.trace.and.stub();
    return {
      traceLoggerSpy,
    };
  }

  /**
   * Get the service, initialize it, set test variables.
   */
  async function getService() {
    /* create the fixture */
    const httpErrorInterceptor = TestBed.get(HttpErrorInterceptor);

    /* get the injected instances */
    const ngxLoggerSpy = TestBed.get(NGXLogger);

    const { traceLoggerSpy } = createSpies(ngxLoggerSpy);

    return {
      httpErrorInterceptor,
      traceLoggerSpy,
      /* give access to expected magic values */
      ...expected(),
    };
  }

  describe('interceptor', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should be created', async () => {
      const { httpErrorInterceptor } = await setup();
      expect(httpErrorInterceptor).toBeTruthy();
    });

    it('should have local variables at initial values', async () => {
      const { httpErrorInterceptor, totalTries, retryDelay } = await setup();

      expect(httpErrorInterceptor['totalTries']).toBe(totalTries);
      expect(httpErrorInterceptor['retryDelay']).toBe(retryDelay);
    });
  });

  describe('has a intercept function that', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('traces that it has been called', async () => {
      const { httpErrorInterceptor, traceLoggerSpy, next } = await setup();
      httpErrorInterceptor.intercept({}, next);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'HttpErrorInterceptor: intercept called',
      );
    });

    it('retries if the request throws an error', fakeAsync(async () => {
      const {
        totalTries,
        retryDelay,
        httpErrorInterceptor,
        traceLoggerSpy,
        requestUrl,
        nextServerError,
        serverError,
      } = await setup();
      const result = httpErrorInterceptor.intercept(
        requestUrl,
        nextServerError,
      );
      result.subscribe(
        (_ok: any) => {
          fail('Should never issue a non-error item');
        },
        (error: any) => {
          /* test an error report property */
          expect(error.error.status).toEqual(serverError.status);
          expect(traceLoggerSpy).toHaveBeenCalledWith(
            `HttpErrorInterceptor: Error 1 received on try 1 of ${totalTries} to ${
              requestUrl.url
            }`,
          );
          expect(traceLoggerSpy).toHaveBeenCalledWith(
            'HttpErrorInterceptor: Error 2 received on try 2 of 3 to testUrl',
          );
          expect(traceLoggerSpy).toHaveBeenCalledWith(
            'HttpErrorInterceptor: Error 3 received on try 3 of 3 to testUrl',
          );
          expect(traceLoggerSpy).toHaveBeenCalledWith(
            'HttpErrorInterceptor: catchError called',
          );
        },
      );
      /* delay to allow for the retries */
      tick((totalTries - 1) * retryDelay);
    }));

    it('retries once if the request throws only one error', fakeAsync(async () => {
      const {
        totalTries,
        retryDelay,
        httpErrorInterceptor,
        traceLoggerSpy,
        requestUrl,
        nextOneError,
        noError,
      } = await setup();
      const result = httpErrorInterceptor.intercept(requestUrl, nextOneError);
      result.subscribe(
        (ok: any) => {
          expect(ok).toBe(noError);
          expect(traceLoggerSpy).toHaveBeenCalledWith(
            `HttpErrorInterceptor: Error 1 received on try 1 of ${totalTries} to ${
              requestUrl.url
            }`,
          );
          /* check only one error message traced */
          const errorCalls = 1;
          const extraCalls = 4; // starting 3 services + 'intercept called'
          expect(traceLoggerSpy).toHaveBeenCalledTimes(errorCalls + extraCalls);
        },
        (_error: any) => {
          fail('Should never issue an error item');
        },
      );
      /* delay to allow for one retry */
      tick(retryDelay);
    }));

    it('constructs error report for a non-ErrorEvent', fakeAsync(async () => {
      const {
        totalTries,
        retryDelay,
        httpErrorInterceptor,
        traceLoggerSpy,
        requestUrl,
        nextServerError,
        serverError,
      } = await setup();
      const result = httpErrorInterceptor.intercept(
        requestUrl,
        nextServerError,
      );
      result.subscribe(
        (_ok: any) => {},
        (error: any) => {
          /* non-ErrorEvent path*/
          expect(traceLoggerSpy).toHaveBeenCalledWith(
            'HttpErrorInterceptor: Server returned an unsuccessful response code',
          );
          /* test an error report property */
          expect(error.allocatedType).toBe('Http server-side');
          expect(error.error.message).toBe(serverError.message);
          expect(error.error.status).toBe(serverError.status);
          expect(error.error.error).toEqual(serverError.error);

          expect(traceLoggerSpy).toHaveBeenCalledWith(
            'HttpErrorInterceptor: Throwing error report on',
          );
        },
      );
      /* delay to allow for the retries */
      tick((totalTries - 1) * retryDelay);
    }));

    it('constructs an error report for an ErrorEvent', fakeAsync(async () => {
      const {
        totalTries,
        retryDelay,
        httpErrorInterceptor,
        traceLoggerSpy,
        requestUrl,
        nextClientError,
      } = await setup();
      const result = httpErrorInterceptor.intercept(
        requestUrl,
        nextClientError,
      );
      result.subscribe(
        (_ok: any) => {},
        (error: any) => {
          /* non-ErrorEvent path*/
          expect(traceLoggerSpy).toHaveBeenCalledWith(
            'HttpErrorInterceptor: Client-side or network error',
          );
          /* test error report properties */
          expect(error.allocatedType).toBe('Http client-side');

          expect(traceLoggerSpy).toHaveBeenCalledWith(
            'HttpErrorInterceptor: Throwing error report on',
          );
        },
      );
      /* delay to allow for the retries */
      tick((totalTries - 1) * retryDelay);
    }));
  });
});
