import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { AppModule } from '../../app.module';
import { RequestCacheService } from './request-cache.service';
import { GetMembersCache } from './get-members-cache.service';

interface INgxLoggerSpy {
  trace: jasmine.Spy;
  error: jasmine.Spy;
}
interface IGetMemberStore {
  response: jasmine.Spy;
  setGetAll: jasmine.Spy;
  setPostOne: jasmine.Spy;
  setPutOne: jasmine.Spy;
  setDeleteOne: jasmine.Spy;
  setDeleteAll: jasmine.Spy;
  clearCache: jasmine.Spy;
}

describe('RequestCacheService', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spies to be injected */
    const ngxLoggerSpy = jasmine.createSpyObj('logger', ['trace', 'error']);
    const getMembersStoreSpy = jasmine.createSpyObj('cache', [
      'response',
      'setGetAll',
      'setPostOne',
      'setPutOne',
      'setDeleteOne',
      'setDeleteAll',
      'clearCache',
    ]);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: NGXLogger, useValue: ngxLoggerSpy },
        { provide: GetMembersCache, useValue: getMembersStoreSpy },
      ],
    }).compileComponents();
  }

  /**
   * List all expected 'magic' values here to be used in tests.
   */
  function expected() {
    const dummyResponse = new HttpResponse();
    const dummyRequest = 'request'; // falsy value
    return {
      readCacheMessage: 'CachingInterceptor: reading from cache',
      readServerMessage: 'CachingInterceptor: reading from server',
      /* next that doesn't trigger put */
      nextText: {
        handle: (value: string) => of(value),
      },
      /* test request */
      dummyRequest,
      /* next that triggers put */
      dummyResponse,
      nextResponse: {
        handle: () => of(dummyResponse),
      },
    };
  }

  function createSpies(
    ngxLoggerSpy: INgxLoggerSpy,
    getMemberStoreSpy: IGetMemberStore,
  ) {
    const traceLoggerSpy = ngxLoggerSpy.trace.and.stub();

    const getResponseSpy = getMemberStoreSpy.response.and.stub();
    const setGetAllSpy = getMemberStoreSpy.setGetAll.and.stub();
    const setPostOneSpy = getMemberStoreSpy.setPostOne.and.stub();
    const setPutOneSpy = getMemberStoreSpy.setPutOne.and.stub();
    const setDeleteOneSpy = getMemberStoreSpy.setDeleteOne.and.stub();
    const setDeleteAllSpy = getMemberStoreSpy.setDeleteAll.and.stub();
    const clearCacheSpy = getMemberStoreSpy.clearCache.and.stub();
    return {
      traceLoggerSpy,
      getResponseSpy,
      setGetAllSpy,
      setPostOneSpy,
      setPutOneSpy,
      setDeleteOneSpy,
      setDeleteAllSpy,
      clearCacheSpy,
    };
  }

  /**
   * Get the service, initialize it, set test variables.
   */
  function getService() {
    /* create the service */
    const requestCache = TestBed.get(RequestCacheService);

    /* get the injected instances */
    const ngxLoggerSpy = TestBed.get(NGXLogger);
    const getMembersStoreSpy = TestBed.get(GetMembersCache);

    return {
      requestCache,
      ...createSpies(ngxLoggerSpy, getMembersStoreSpy),
      /* give access to expected magic values */
      ...expected(),
    };
  }

  describe('service', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should be created', async () => {
      const { requestCache } = await setup();
      expect(requestCache).toBeTruthy();
    });
  });

  describe('has a clear cache function', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('that calls clear cache', async () => {
      const { requestCache, traceLoggerSpy, clearCacheSpy } = await setup();
      requestCache.clearCache();
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'RequestCacheService: clearing cache',
      );
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('has a get cache function', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('that gets the cache', async () => {
      const { requestCache, traceLoggerSpy, getResponseSpy } = await setup();
      const request = {
        method: 'GET',
        urlWithParams: requestCache.baseUrl,
      };
      const result = requestCache.getCache(request);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'RequestCacheService: getting cache',
      );
      expect(result).toEqual(getResponseSpy);
    });

    it('that fails to get the cache #1', async () => {
      const { requestCache, traceLoggerSpy } = await setup();
      const request = {
        method: 'dummy',
        urlWithParams: requestCache.baseUrl,
      };
      const result = requestCache.getCache(request);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'RequestCacheService: getting cache',
      );
      expect(result).toEqual(undefined);
    });

    it('that fails to get the cache #2', async () => {
      const { requestCache, traceLoggerSpy } = await setup();
      const request = {
        method: 'GET',
        urlWithParams: 'dummy',
      };
      const result = requestCache.getCache(request);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'RequestCacheService: getting cache',
      );
      expect(result).toEqual(undefined);
    });
  });

  describe('has a put cache function', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('that clears the cache #1', async () => {
      const { requestCache, clearCacheSpy } = await setup();
      const request = {};
      /* status other than 200 or 201 will clear cache */
      const response = {
        status: 500,
      };
      requestCache.putCache(request, response);
      /* clearCacheSpy is called in clearCache() */
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    });

    it('that clears the cache #2', async () => {
      const { requestCache, clearCacheSpy } = await setup();
      const request = {
        method: 'DUMMY',
      };
      /* status other than 200 or 201 will clear cache */
      const response = {
        status: 200,
      };
      requestCache.putCache(request, response);
      /* clearCacheSpy is called in clearCache() */
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    });

    it('that calls setGetAll', async () => {
      const { requestCache, clearCacheSpy, setGetAllSpy } = await setup();
      const request = {
        method: 'GET',
        urlWithParams: requestCache.baseUrl,
      };
      const response = {
        status: 200, // test 200
      };
      requestCache.putCache(request, response);
      expect(setGetAllSpy).toHaveBeenCalledTimes(1);
      expect(setGetAllSpy).toHaveBeenCalledWith(response);
      expect(clearCacheSpy).toHaveBeenCalledTimes(0);
    });

    it('that fails to call setGetAll', async () => {
      const { requestCache, clearCacheSpy, setGetAllSpy } = await setup();
      const request = {
        method: 'GET',
        urlWithParams: 'dummy', // will fail
      };
      const response = {
        status: 200, // test 200
      };
      requestCache.putCache(request, response);
      expect(setGetAllSpy).toHaveBeenCalledTimes(0);
      expect(clearCacheSpy).toHaveBeenCalledTimes(0);
    });

    it('that calls setPostOne', async () => {
      const { requestCache, clearCacheSpy, setPostOneSpy } = await setup();
      const request = {
        method: 'POST',
        urlWithParams: requestCache.baseUrl,
      };
      const response = {
        status: 201, // test 201
      };
      requestCache.putCache(request, response);
      expect(setPostOneSpy).toHaveBeenCalledTimes(1);
      expect(setPostOneSpy).toHaveBeenCalledWith(response);
      expect(clearCacheSpy).toHaveBeenCalledTimes(0);
    });

    it('that fails to call setPostOne', async () => {
      const { requestCache, clearCacheSpy, setPostOneSpy } = await setup();
      const request = {
        method: 'POST',
        urlWithParams: 'dummy', // will fail
      };
      const response = {
        status: 200, // test 200
      };
      requestCache.putCache(request, response);
      expect(setPostOneSpy).toHaveBeenCalledTimes(0);
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    });

    it('that calls setPutOne', async () => {
      const { requestCache, clearCacheSpy, setPutOneSpy } = await setup();
      const request = {
        method: 'PUT',
        urlWithParams: requestCache.baseUrl,
      };
      const response = {
        status: 200, // test 201
      };
      requestCache.putCache(request, response);
      expect(setPutOneSpy).toHaveBeenCalledTimes(1);
      expect(setPutOneSpy).toHaveBeenCalledWith(response);
      expect(clearCacheSpy).toHaveBeenCalledTimes(0);
    });

    it('that fails to call setPutOne', async () => {
      const { requestCache, clearCacheSpy, setPutOneSpy } = await setup();
      const request = {
        method: 'PUT',
        urlWithParams: 'dummy', // will fail
      };
      const response = {
        status: 200, // test 200
      };
      requestCache.putCache(request, response);
      expect(setPutOneSpy).toHaveBeenCalledTimes(0);
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    });

    it('that calls setDeleteAll', async () => {
      const { requestCache, clearCacheSpy, setDeleteAllSpy } = await setup();
      const request = {
        method: 'DELETE',
        urlWithParams: requestCache.baseUrl,
      };
      const response = {
        status: 200, // test 201
      };
      requestCache.putCache(request, response);
      expect(setDeleteAllSpy).toHaveBeenCalledTimes(1);
      expect(clearCacheSpy).toHaveBeenCalledTimes(0);
    });

    it('that calls setDeleteOne', async () => {
      const { requestCache, clearCacheSpy, setDeleteOneSpy } = await setup();
      const request = {
        method: 'DELETE',
        urlWithParams: `${requestCache.baseUrl}/21`, // will fail
      };
      const response = {
        status: 200, // test 200
      };
      requestCache.putCache(request, response);
      expect(setDeleteOneSpy).toHaveBeenCalledTimes(1);
      expect(setDeleteOneSpy).toHaveBeenCalledWith(request);
      expect(clearCacheSpy).toHaveBeenCalledTimes(0);
    });

    it('that fails to call setDelete*', async () => {
      const { requestCache, clearCacheSpy } = await setup();
      const request = {
        method: 'DELETE',
        urlWithParams: 'dummy', // will fail
      };
      const response = {
        status: 201, // test 201
      };
      requestCache.putCache(request, response);
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    });
  });
});
