import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { HttpResponse, HttpRequest } from '@angular/common/http';
import { AppModule } from '../../app.module';
import { GetMembersCache } from './get-members-cache.service';

interface INgxLoggerSpy {
  trace: jasmine.Spy;
  error: jasmine.Spy;
}

describe('RequestCacheService', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spies to be injected */
    const ngxLoggerSpy = jasmine.createSpyObj('logger', ['trace', 'error']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: NGXLogger, useValue: ngxLoggerSpy },
      ],
    }).compileComponents();
  }

  /**
   * List all expected 'magic' values here to be used in tests.
   */
  function expected() {
    return {};
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
  function getService() {
    /* get the service */
    const getMembersCache = TestBed.get(GetMembersCache);

    /* get the injected instances */
    const ngxLoggerSpy = TestBed.get(NGXLogger);

    return {
      getMembersCache,
      ...createSpies(ngxLoggerSpy),
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
      const { getMembersCache } = await setup();
      expect(getMembersCache).toBeTruthy();
    });
  });

  describe('response property', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should return the cache', async () => {
      const { getMembersCache } = await setup();
      /* set cache */
      const cache = 'dummy';
      getMembersCache._response = cache;
      /* get response */
      const result = getMembersCache.response;
      /* test result equals cache */
      expect(result).toEqual(cache);
    });
  });

  describe('setGetAll()', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should set cache to the provided parameter', async () => {
      const { getMembersCache } = await setup();
      /* input parameter */
      const dummyParameter = 'dummy';
      getMembersCache.setGetAll(dummyParameter);
      /* test cache equals input parameter */
      expect(getMembersCache.response).toEqual(dummyParameter);
    });
  });

  describe('setPostOne()', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should set cache to undefined if cache.body or parameter.body is falsy', async () => {
      const { getMembersCache } = await setup();

      /* set cache and a parameter with no body */
      getMembersCache._response = 'dummyCache';
      const dummyParameter = {
        body: '', // falsy value
      };
      /* run test */
      getMembersCache.setPostOne(dummyParameter);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(undefined);

      /* set empty cache and a parameter with a body */
      getMembersCache._response = {
        body: undefined,
      };
      dummyParameter.body = 'dummy';
      /* run test */
      getMembersCache.setPostOne(dummyParameter);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(undefined);
    });

    it('should add item to the cache response body', async () => {
      const { getMembersCache } = await setup();

      /* create cache and input parameter */
      getMembersCache._response = new HttpResponse({
        body: ['a', 'b', 'c'],
        url: 'dummyUrlCache',
      });

      const dummyAddMemberResponse = new HttpResponse({
        body: 'd',
        url: 'dummyUrlInput',
      });
      const expectedCache = new HttpResponse({
        body: ['a', 'b', 'c', 'd'],
        url: 'dummyUrlCache',
      });

      /* run setPostOne */
      getMembersCache.setPostOne(dummyAddMemberResponse);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(expectedCache);
    });
  });

  describe('setPutOne()', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should set cache to undefined if cache.body or parameter.body is falsy', async () => {
      const { getMembersCache } = await setup();

      /* set cache and a parameter with no body */
      getMembersCache._response = 'dummyCache';
      const dummyParameter = {
        body: '', // falsy value
      };
      /* run test */
      getMembersCache.setPutOne(dummyParameter);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(undefined);

      /* set empty cache and a parameter with a body */
      getMembersCache._response = {
        body: undefined,
      };
      dummyParameter.body = 'dummy';
      /* run test */
      getMembersCache.setPutOne(dummyParameter);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(undefined);
    });

    it('should update item in the cache response body', async () => {
      const { getMembersCache } = await setup();

      /* create cache and input parameter */
      getMembersCache._response = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });
      const dummyUpdateMemberResponse = new HttpResponse({
        body: { id: 2, name: 'd' },
        url: 'dummyUrlInput',
      });
      const expectedCache = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 2, name: 'd' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });

      /* run setPostOne */
      getMembersCache.setPutOne(dummyUpdateMemberResponse);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(expectedCache);
    });

    it('should set cache to undefined if no id match', async () => {
      const { getMembersCache } = await setup();

      /* create cache and input parameter */
      getMembersCache._response = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });

      const dummyUpdateMemberResponse = new HttpResponse({
        body: { id: 4, name: 'd' },
        url: 'dummyUrlInput',
      });
      const expectedCache = undefined;

      /* run setPostOne */
      getMembersCache.setPutOne(dummyUpdateMemberResponse);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(expectedCache);
    });
  });

  describe('setDeleteOne()', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should set cache to undefined if cache.body is falsy', async () => {
      const { getMembersCache } = await setup();

      /* set empty cache and a parameter with a body */
      getMembersCache._response = {
        body: undefined,
      };
      const dummyParameter = {
        body: 'dummy',
      };
      /* run test */
      getMembersCache.setDeleteOne(dummyParameter);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(undefined);
    });

    it('should delete item in the cache response body', async () => {
      const { getMembersCache } = await setup();

      /* create cache and input parameter */
      getMembersCache._response = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 299, name: 'b' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });

      const dummyDeleteRequest = new HttpRequest('DELETE', 'dummyUrl/299');
      const expectedCache = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });

      /* run setPostOne */
      getMembersCache.setDeleteOne(dummyDeleteRequest);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(expectedCache);
    });

    it('should set cache to undefined if valid id not found', async () => {
      const { getMembersCache } = await setup();

      /* create cache and input parameter */
      getMembersCache._response = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });

      const dummyDeleteRequest = new HttpRequest(
        'DELETE',
        'dummyUrl', // no '/'
      );
      const expectedCache = undefined;

      /* run setPostOne */
      getMembersCache.setDeleteOne(dummyDeleteRequest);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(expectedCache);
    });

    it('should set cache to undefined if valid id not found 2', async () => {
      const { getMembersCache } = await setup();

      /* create cache and input parameter */
      getMembersCache._response = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });

      const dummyDeleteRequest = new HttpRequest(
        'DELETE',
        'dummy/Url', // /txt'
      );
      const expectedCache = undefined;

      /* run setPostOne */
      getMembersCache.setDeleteOne(dummyDeleteRequest);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(expectedCache);
    });

    it('should set cache to undefined if no id match', async () => {
      const { getMembersCache } = await setup();

      /* create cache and input parameter */
      getMembersCache._response = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });

      const dummyDeleteRequest = new HttpRequest('DELETE', 'dummyUrl/4');
      const expectedCache = undefined;

      /* run setPostOne */
      getMembersCache.setDeleteOne(dummyDeleteRequest);
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(expectedCache);
    });
  });

  describe('setDeleteAll()', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should set cache to undefined if cache.body is falsy', async () => {
      const { getMembersCache } = await setup();

      /* set empty cache and a parameter with a body */
      getMembersCache._response = {
        body: undefined,
      };
      /* run test */
      getMembersCache.setDeleteAll();
      /* test cache equals undefined */
      expect(getMembersCache.response).toEqual(undefined);
    });

    it('should set cache to an empty array', async () => {
      const { getMembersCache } = await setup();

      /* create cache */
      getMembersCache._response = new HttpResponse({
        body: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        url: 'dummyUrlCache',
      });
      /* expect cache to have empty array */
      const expectedCache = new HttpResponse({
        body: [],
        url: 'dummyUrlCache',
      });
      /* run test */
      getMembersCache.setDeleteAll();
      /* test cache equals input parameter */
      expect(getMembersCache.response).toEqual(expectedCache);
    });
  });
});
