import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { Type } from '@angular/core';
import { AppModule } from '../../app.module';
import { E2eTestInterceptor } from './e2e-test.interceptor';
import { errorMember, errorTestUrls, E2E_TESTING } from '../../config';

interface INgxLoggerSpy {
  trace: jasmine.Spy;
  error: jasmine.Spy;
}

describe('E2eTestInterceptor', () => {
  /* setup function run by each sub test suite */
  async function mainSetup(isTesting: boolean) {
    /* create spies to be injected */
    const ngxLoggerSpy = jasmine.createSpyObj('ngxLogger', ['trace', 'error']);
    const E2E_TESTING_SPY = isTesting;

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        E2eTestInterceptor,
        { provide: NGXLogger, useValue: ngxLoggerSpy },
        { provide: E2E_TESTING, useValue: E2E_TESTING_SPY },
      ],
    }).compileComponents();
  }

  /**
   * List all expected 'magic' values here to be used in tests.
   */
  function expected() {
    const error998 = 998;
    const error999 = 999;
    return {
      error998,
      error999,
    };
  }

  function createSpies(ngxLoggerSpy: INgxLoggerSpy) {
    /* spy on ngxLogger.trace */
    const traceLoggerSpy = ngxLoggerSpy.trace.and.stub();

    /* create a next.handle function that can be spied upon */
    const nextSpy = jasmine.createSpyObj('next', ['handle']);
    const nextHandleSpy = nextSpy.handle.and.callFake((value: any) => value);

    return {
      traceLoggerSpy,
      nextSpy,
      nextHandleSpy,
    };
  }

  /**
   * Get the service, initialize it, set test variables.
   */
  function getService() {
    /* create the service */
    const e2eTestInterceptor: E2eTestInterceptor = TestBed.get(
      E2eTestInterceptor as Type<E2eTestInterceptor>,
    );

    /* get the injected instances */
    const ngxLoggerSpy = TestBed.get(NGXLogger) as INgxLoggerSpy;
    const E2E_TESTING_SPY = TestBed.get(E2E_TESTING) as boolean;

    return {
      e2eTestInterceptor,
      E2E_TESTING_SPY,
      /* give access to spies */
      ...createSpies(ngxLoggerSpy),
      /* give access to expected magic values */
      ...expected(),
    };
  }

  /* setup function run by each sub test function */
  async function setup(isTesting = true) {
    /* the isTesting parameter sets E2E_TESTING (which says whether e2e testing is ongoing */
    await mainSetup(isTesting);
    return getService();
  }

  describe('interceptor', () => {
    it('should be created', async () => {
      const { e2eTestInterceptor } = await setup();
      expect(e2eTestInterceptor).toBeTruthy();
    });
  });

  describe('has a intercept function that', () => {
    it('traces that it has been called', async () => {
      const { e2eTestInterceptor, traceLoggerSpy, nextSpy } = await setup();
      const req: any = {};
      e2eTestInterceptor.intercept(req, nextSpy);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'E2eTestInterceptor: intercept called',
      );
    });

    it('returns if E2E_TESTING is false', async () => {
      const {
        e2eTestInterceptor,
        traceLoggerSpy,
        nextSpy,
        nextHandleSpy,
      } = await setup(false);
      const req: any = {
        dummy: 'dummy',
      };
      const loggerCallsStart = traceLoggerSpy.calls.count();
      const expectedCalls = 2;
      const returned = e2eTestInterceptor.intercept(req, nextSpy);
      expect(nextHandleSpy).toHaveBeenCalledWith(req);
      expect(returned).toEqual(req);
      /* test logger not called after if statement */
      expect(traceLoggerSpy).toHaveBeenCalledTimes(
        loggerCallsStart + expectedCalls,
      );
    });

    it('returns if E2E_TESTING is true and post or put but errorMember.name does not match', async () => {
      const {
        e2eTestInterceptor,
        traceLoggerSpy,
        nextSpy,
        nextHandleSpy,
      } = await setup(true);
      const req: any = {
        method: 'POST',
        urlWithParams: errorTestUrls.post.slice('POST:'.length),
        body: {
          name: 'dummy',
        },
      };
      const loggerCallsStart = traceLoggerSpy.calls.count();
      const expectedCalls = 3;
      const returned = e2eTestInterceptor.intercept(req, nextSpy);
      expect(nextHandleSpy).toHaveBeenCalledWith(req);
      expect(returned).toEqual(req);
      /* test logger not called after if statement */
      expect(traceLoggerSpy).toHaveBeenCalledTimes(
        loggerCallsStart + expectedCalls,
      );
    });

    it('returns an error if E2E_TESTING is true and post or put and errorMember.name matches', async () => {
      const {
        e2eTestInterceptor,
        traceLoggerSpy,
        nextSpy,
        nextHandleSpy,
        error998,
      } = await setup(true);
      const req: any = {
        method: 'POST',
        urlWithParams: errorTestUrls.post.slice('POST:'.length),
        body: {
          name: errorMember.name,
        },
      };
      const loggerCallsStart = traceLoggerSpy.calls.count();
      const expectedCalls = 4;
      const returned = e2eTestInterceptor.intercept(req, nextSpy);
      expect(nextHandleSpy).not.toHaveBeenCalled();
      /* test logger not called after if statement */
      expect(traceLoggerSpy).toHaveBeenCalledTimes(
        loggerCallsStart + expectedCalls,
      );
      /* test that an error is returned */
      returned.subscribe(
        () => {
          fail('error expected');
        },
        (error: any) => {
          expect(error.status).toEqual(error998);
        },
      );
    });

    it('returns an error if E2E_TESTING is true and getOne', async () => {
      const {
        e2eTestInterceptor,
        traceLoggerSpy,
        nextSpy,
        nextHandleSpy,
        error999,
      } = await setup(true);
      const req: any = {
        method: 'GET',
        urlWithParams: errorTestUrls.getOne.slice('GET:'.length),
        body: {
          name: errorMember.name,
        },
      };
      const loggerCallsStart = traceLoggerSpy.calls.count();
      const expectedCalls = 4;
      const returned = e2eTestInterceptor.intercept(req, nextSpy);
      expect(nextHandleSpy).not.toHaveBeenCalled();
      /* test logger not called after if statement */
      expect(traceLoggerSpy).toHaveBeenCalledTimes(
        loggerCallsStart + expectedCalls,
      );
      /* test that an error is returned */
      returned.subscribe(
        () => {
          fail('error expected');
        },
        (error: any) => {
          expect(error.status).toEqual(error999);
        },
      );
    });

    it('returns an error if E2E_TESTING is true and getAll', async () => {
      const {
        e2eTestInterceptor,
        traceLoggerSpy,
        nextSpy,
        nextHandleSpy,
      } = await setup(true);
      const req: any = {
        method: 'DELETE',
        urlWithParams: errorTestUrls.delete.slice('DELETE:'.length),
        body: {
          name: errorMember.name,
        },
      };
      const loggerCallsStart = traceLoggerSpy.calls.count();
      const expectedCalls = 4;
      try {
        e2eTestInterceptor.intercept(req, nextSpy);
      } catch (error) {
        expect(error.message).toEqual('Test unexpected error');
      }
      expect(nextHandleSpy).not.toHaveBeenCalled();
      /* test logger not called after if statement */
      expect(traceLoggerSpy).toHaveBeenCalledTimes(
        loggerCallsStart + expectedCalls,
      );
    });
  });
});
