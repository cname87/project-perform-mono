import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MembersApi, IMemberWithoutId, IMember } from './api-members.service';
import { asyncData } from '../shared/test-helpers';
import { membersConfiguration } from './configuration';
import { ICount } from './model/count';
import { AppModule } from '../app.module';
import { RouterTestingModule } from '@angular/router/testing';
import { APP_BASE_HREF } from '@angular/common';

interface IHttpClientStub {
  post: jasmine.Spy;
  get: jasmine.Spy;
  put: jasmine.Spy;
  delete: jasmine.Spy;
}

describe('MembersApi', () => {
  async function mainSetup() {
    /* create stub instances with spies for injection */
    const mockMemberWithoutId = { name: 'testName' };
    const httpClientStub: IHttpClientStub = {
      post: jasmine.createSpy('post').and.callFake(
        (_url: string, m: IMemberWithoutId, _opt: any): Observable<IMember> => {
          return asyncData({ id: 21, name: m.name });
        },
      ),
      get: jasmine.createSpy('get').and.callFake(
        (_url: string, opts: any): Observable<IMember | IMember[]> => {
          if (opts.params) {
            return asyncData([
              { id: 21, name: 'test21' },
              { id: 22, name: 'test22' },
            ]);
          } else {
            return asyncData({ id: 21, name: 'test21' });
          }
        },
      ),
      put: jasmine.createSpy('put').and.callFake(
        (_url: string, m: IMember, _opt: any): Observable<IMember> => {
          return asyncData({ id: 21, name: m.name });
        },
      ),
      delete: jasmine.createSpy('delete').and.callFake(
        (_url: string, _opts: any): Observable<ICount> => {
          return asyncData({ count: 3 });
        },
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: HttpClient, useValue: httpClientStub },
      ],
    }).compileComponents();

    const membersApi: MembersApi = TestBed.get(MembersApi);
    const httpClient: IHttpClientStub = TestBed.get(HttpClient);

    return {
      mockMemberWithoutId,
      membersApi,
      httpClient,
    };
  }

  async function setup() {
    return mainSetup();
  }

  function testHttpMethodCall(
    httpClient: IHttpClientStub,
    httpMethod: string,
    isIdInUrl = false,
  ) {
    expect(httpClient[httpMethod].calls.count()).toEqual(
      1,
      'Http method called once',
    );

    /* get array of arguments for the http method call */
    const argsArray: any[] = httpClient[httpMethod].calls.argsFor(0);

    /* first argument is the url */
    const idUrl = isIdInUrl ? '/9' : '';
    expect(argsArray[0]).toEqual(
      membersConfiguration.basePath +
        '/' +
        membersConfiguration.servicePath +
        idUrl,
      'Http method called with configured url',
    );

    /* last parameter is options object */
    expect(argsArray[argsArray.length - 1].withCredentials).toEqual(
      membersConfiguration.withCredentials,
      'Http method called with configured withCredentials option',
    );

    /* test options.headers */
    let headers = membersConfiguration.defaultHeaders;
    headers = headers.set('Accept', 'application/json');
    /* only methods 'post' and 'put' set Content-Type */
    let contentType = null;
    if (httpMethod === 'post' || httpMethod === 'put') {
      headers = headers.set('Content-Type', 'application/json');
      contentType = 'application/json';
    }
    expect(argsArray[argsArray.length - 1].headers).toEqual(
      headers,
      'Http method called with configured headers',
    );
    expect(argsArray[argsArray.length - 1].headers.get('Accept')).toBe(
      'application/json',
      'Http method called with configured header Accept option',
    );
    expect(argsArray[argsArray.length - 1].headers.get('Content-Type')).toBe(
      contentType,
      'Http method called with configured header Content-Type option',
    );
  }

  function testErrors(operation: string, httpMethod: string) {
    it('should have operation(null) throw an error', async () => {
      const { membersApi, httpClient } = await setup();
      try {
        await membersApi[operation](null as any).toPromise();
        fail('should not reach this point');
      } catch (err) {
        expect(err.message.substring(0, 18)).toEqual('Required parameter');
      }
      expect(httpClient[httpMethod].calls.count()).toEqual(
        0,
        'httpClient method not called',
      );
    });

    it('should have operation(undefined) throw and error', async () => {
      const { membersApi, httpClient } = await setup();
      try {
        await membersApi[operation](undefined as any).toPromise();
        fail('should not reach this point');
      } catch (err) {
        expect(err.message.substring(0, 18)).toEqual('Required parameter');
      }
      expect(httpClient[httpMethod].calls.count()).toEqual(
        0,
        'httpClient method not called',
      );
    });
  }

  function testAddMember() {
    return () => {
      it('should have addMember(memberWithoutId) return a member', async () => {
        const { mockMemberWithoutId, membersApi, httpClient } = await setup();

        /* call MembersApi function */
        const result = await membersApi
          .addMember(mockMemberWithoutId)
          .toPromise();

        /* use shared function to test http method call */
        testHttpMethodCall(httpClient, 'post');

        /* test outside shared function as is unique */
        expect(httpClient.post.calls.argsFor(0)[1]).toEqual(
          mockMemberWithoutId,
          'Http method called with supplied member',
        );

        /* test response */
        expect(result).toEqual(
          { id: 21, name: mockMemberWithoutId.name },
          'member returned',
        );
      });

      /* test common error paths */
      testErrors('addMember', 'post');
    };
  }

  function testGetMembers(name: string | undefined, queryName: string | null) {
    return () => {
      it('should have getMembers() return an array of members', async () => {
        const { membersApi, httpClient } = await setup();

        /* call MembersApi function */
        const result = await membersApi.getMembers(name).toPromise();

        /* use shared function to test http method call */
        testHttpMethodCall(httpClient, 'get');

        /* last parameter is options object */
        expect(httpClient.get.calls.argsFor(0)[1].params.get('name')).toEqual(
          queryName,
          'Http method called with params in options',
        );

        /* test response */
        expect(result[1]).toEqual(
          { id: 22, name: 'test22' },
          'members returned',
        );
      });
    };
  }

  function testGetMember(id: number) {
    return () => {
      it('should have getMember() return a member', async () => {
        const { membersApi, httpClient } = await setup();

        /* call MembersApi function */
        const result = await membersApi.getMember(id).toPromise();

        /* use shared function to test http method call */
        testHttpMethodCall(httpClient, 'get', true);

        /* test response */
        expect(result).toEqual({ id: 21, name: 'test21' }, 'members returned');
      });

      /* test common error paths */
      testErrors('getMember', 'get');
    };
  }

  function testUpdateMember(member: IMember) {
    return () => {
      it('should have updateMember(member) return a member', async () => {
        const { membersApi, httpClient } = await setup();

        /* call MembersApi function */
        const result = await membersApi.updateMember(member).toPromise();

        /* use shared function to test http method call */
        testHttpMethodCall(httpClient, 'put');

        /* test response */
        expect(result).toEqual(member, 'members returned');
      });

      /* test common error paths */
      testErrors('updateMember', 'put');
    };
  }

  function testDeleteMember(id: number) {
    return () => {
      it('should have deleteMember() return a count', async () => {
        const { membersApi, httpClient } = await setup();

        /* call MembersApi function */
        const result = await membersApi.deleteMember(id).toPromise();

        /* use shared function to test http method call */
        testHttpMethodCall(httpClient, 'delete', true);

        /* test response */
        expect(result).toEqual({ count: 3 }, 'count returned');
      });

      /* test common error paths */
      testErrors('deleteMember', 'delete');
    };
  }

  function testDeleteMembers() {
    return () => {
      it('should have deleteMembers() return a count', async () => {
        const { membersApi, httpClient } = await setup();

        /* call MembersApi function */
        const result = await membersApi.deleteMembers().toPromise();

        /* use shared function to test http method call */
        testHttpMethodCall(httpClient, 'delete');

        /* test response */
        expect(result).toEqual({ count: 3 }, 'count returned');
      });
    };
  }
  describe('setup', () => {
    it('should be created', async () => {
      const { membersApi } = await setup();
      expect(membersApi).toBeTruthy();
    });
  });

  describe('addMember', testAddMember());
  /* test getMembers() */
  describe('getMembers', testGetMembers(undefined, null));
  /* test getMembers('testName') */
  describe('getMembers', testGetMembers('testName', 'testName'));
  /* test custom encoder */
  describe('getMembers', testGetMembers('test+1', 'test%2B1'));
  describe('getMember', testGetMember(9));
  describe('updateMember', testUpdateMember({ id: 21, name: 'test21' }));
  describe('deleteMember', testDeleteMember(9));
  describe('addMember', testDeleteMembers());
});
