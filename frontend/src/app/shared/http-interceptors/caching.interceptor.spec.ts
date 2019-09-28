import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { HttpResponse } from '@angular/common/http';

import { AppModule } from '../../app.module';
import { CachingInterceptor } from './caching.interceptor';
import { of } from 'rxjs';
import { RequestCacheService } from '../caching.service/request-cache.service';
import { environment } from '../../../environments/environment';

interface INgxLoggerSpy {
  trace: jasmine.Spy;
  error: jasmine.Spy;
  getConfigSnapshot: jasmine.Spy;
  updateConfig: jasmine.Spy;
}
interface ICacheSpy {
  getCache: jasmine.Spy;
  putCache: jasmine.Spy;
}

describe('CachingInterceptor', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spies to be injected */
    const ngxLoggerSpy = jasmine.createSpyObj('ngxLogger', [
      'trace',
      'error',
      'getConfigSnapshot',
      'updateConfig',
    ]);
    const cacheSpy = jasmine.createSpyObj('cache', ['getCache', 'putCache']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: NGXLogger, useValue: ngxLoggerSpy },
        { provide: RequestCacheService, useValue: cacheSpy },
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

  function createSpies(ngxLoggerSpy: INgxLoggerSpy, cacheSpy: ICacheSpy) {
    const traceLoggerSpy = ngxLoggerSpy.trace.and.stub();
    const getConfigSnapshotSpy = ngxLoggerSpy.getConfigSnapshot.and.callFake(
      () => {
        return {
          level: 0,
        };
      },
    );
    const updateConfigSpy = ngxLoggerSpy.updateConfig.and.stub();
    /* default to get a falsy value, otherwise set the cache value before use */
    let localCache = '';
    function setCache(value: any) {
      localCache = value;
    }
    /* set getCache up so it can return a cached value or undefined */
    const getCacheSpy = cacheSpy.getCache.and.callFake(() => {
      return localCache;
    });
    /* just need to track calls */
    const putCacheSpy = cacheSpy.putCache.and.stub();
    return {
      traceLoggerSpy,
      getConfigSnapshotSpy,
      updateConfigSpy,
      getCacheSpy,
      putCacheSpy,
      setCache,
    };
  }

  /**
   * Get the service, initialize it, set test variables.
   */
  async function getService(e2eTesting = false) {
    /* create the service */
    const cachingInterceptor = TestBed.get(CachingInterceptor);

    /* get the injected instances */
    const ngxLoggerSpy = TestBed.get(NGXLogger);
    const cacheSpy = TestBed.get(RequestCacheService);

    /* set environment.e2eTesting to false by default */
    environment.e2eTesting = e2eTesting;

    return {
      cachingInterceptor,
      ...createSpies(ngxLoggerSpy, cacheSpy),
      /* give access to expected magic values */
      ...expected(),
    };
  }

  describe('interceptor', async () => {
    /* setup function run by each sub test function */
    async function setup(e2eTesting = false) {
      await mainSetup();
      return getService(e2eTesting);
    }

    it('should be created', async () => {
      const { cachingInterceptor } = await setup();
      expect(cachingInterceptor).toBeTruthy();
    });
  });

  describe('has a intercept function that', async () => {
    /* setup function run by each sub test function */
    async function setup(e2eTesting = false) {
      await mainSetup();
      return getService(e2eTesting);
    }

    it('traces that it has been called', async () => {
      const { cachingInterceptor, traceLoggerSpy, nextText } = await setup();
      cachingInterceptor.intercept({}, nextText);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'CachingInterceptor: intercept called',
      );
    });

    it('gets the cache', async () => {
      const {
        cachingInterceptor,
        traceLoggerSpy,
        getCacheSpy,
        setCache,
        dummyRequest,
        nextText,
        readCacheMessage,
      } = await setup();
      /* load the cache so it returns a truthy value */
      const dummyCache = 'test1';
      setCache(dummyCache);
      /* call intercept so cache is read */
      const result$ = cachingInterceptor.intercept(dummyRequest, nextText);
      const result = await result$.toPromise();
      expect(getCacheSpy).toHaveBeenCalledTimes(1);
      expect(traceLoggerSpy).toHaveBeenCalledWith(readCacheMessage);
      /* cache is returned */
      expect(result).toEqual(dummyCache);
    });

    it('fails to get the cache', async () => {
      /* test with e2eTesting set to true */
      const {
        cachingInterceptor,
        traceLoggerSpy,
        getConfigSnapshotSpy,
        updateConfigSpy,
        dummyRequest,
        nextText,
        readCacheMessage,
      } = await setup(true);
      /* spy on sendRequest */
      spyOn(cachingInterceptor, 'sendRequest').and.returnValue('testReturn');
      /* call intercept and cache is read but returns falsy by default */
      const result = cachingInterceptor.intercept(dummyRequest, nextText);
      /* cache will not be read */
      expect(traceLoggerSpy).not.toHaveBeenCalledWith(readCacheMessage);
      /* sendRequest called with expected parameters */
      expect(cachingInterceptor.sendRequest).toHaveBeenCalledWith(
        dummyRequest,
        nextText,
        cachingInterceptor.cache,
      );
      /* sendRequest returns as expected */
      expect(result).toEqual('testReturn');
      /* test e2eTesting = true calls logger functions */
      expect(getConfigSnapshotSpy).toHaveBeenCalled();
      expect(updateConfigSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('has a sendRequest function that', async () => {
    /* setup function run by each sub test function */
    async function setup(e2eTesting = false) {
      await mainSetup();
      return getService(e2eTesting);
    }

    it('fails to load the cache', async () => {
      const {
        cachingInterceptor,
        traceLoggerSpy,
        putCacheSpy,
        dummyRequest,
        nextText,
        readServerMessage,
      } = await setup();
      /* call intercept and cache is read but returns falsy by default */
      const result$ = cachingInterceptor.intercept(dummyRequest, nextText);
      /* result will hold what sendRequest returns */
      const result = await result$.toPromise();
      /* sendRequest will be called */
      expect(traceLoggerSpy).toHaveBeenCalledWith(readServerMessage);
      /* putCache not called as nextText does not return a HttpResponse*/
      expect(putCacheSpy).toHaveBeenCalledTimes(0);
      /* check first intercept parameter is passed through */
      expect(result).toEqual(dummyRequest, 'first intercept parameter');
    });

    it('loads the cache', async () => {
      /* test with e2eTesting set to true */
      const {
        cachingInterceptor,
        traceLoggerSpy,
        getConfigSnapshotSpy,
        updateConfigSpy,
        putCacheSpy,
        nextResponse,
        readServerMessage,
        dummyRequest,
        dummyResponse,
      } = await setup(true);
      /* call intercept and cache is read but returns falsy by default */
      const result$ = cachingInterceptor.intercept(dummyRequest, nextResponse);
      /* result will hold what sendRequest returns */
      const result = await result$.toPromise();
      /* sendRequest will be called */
      expect(traceLoggerSpy).toHaveBeenCalledWith(readServerMessage);
      /* putCache celled with the correct parameters */
      expect(putCacheSpy).toHaveBeenCalledWith(dummyRequest, dummyResponse);
      /* check first intercept parameter passed through */
      expect(result).toEqual(dummyResponse);
      /* test e2eTesting = true calls logger functions */
      expect(getConfigSnapshotSpy).toHaveBeenCalled();
      const updateConfigCalls = 4;
      expect(updateConfigSpy).toHaveBeenCalledTimes(updateConfigCalls);
    });
  });
});
