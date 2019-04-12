/**
 * This client-side script sends requests that drive testing the application api paths.
 */

/* imports to avoid tslint errors only */
// import '/node_modules/mocha/mocha.js';
// import * as chai from 'chai';

async function deleteData(url = '') {
  const myRequest = new Request(url);
  const myInit: RequestInit = {
    method: 'DELETE',
    cache: 'no-cache',
    credentials: 'omit',
  };
  const fetched = await fetch(myRequest, myInit);
  return fetched;
}

async function getData(url = '') {
  const myRequest = new Request(url);
  const myInit: RequestInit = {
    method: 'GET',
    cache: 'no-cache',
    credentials: 'omit',
  };
  const fetched = await fetch(myRequest, myInit);
  return fetched;
}

async function postData(url = '', data = {}) {
  const myRequest = new Request(url);
  const myInit: RequestInit = {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
  };
  const fetched = await fetch(myRequest, myInit);
  return fetched;
}

async function closeTest(number: number, message: string) {
  await new Promise(async (resolve) => {
    const url = 'https://localhost:1337/raiseEvent';
    const data = {
      number,
      message,
    };
    const response = await postData(url, data);

    chai.expect(response.ok).to.eql(true);

    resolve();
  });
}

describe('Api requests', () => {
  before('Signal tests starting', async () => {
    console.log('Starting API requests tests');

    /* signal server that client 404 test starting */
    const url = 'https://localhost:1337/raiseEvent';
    const data = {
      number: 1,
      message: 'API tests start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Sigma tests ending', async () => {
    await closeTest(2, 'API tests end');
  });

  it('should delete all members', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const response = await deleteData(url);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { count: n } */
    chai.expect(readBody.count, 'Number deleted').to.be.above(0);
  });

  it('should create a member', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 1, name: 'test1' };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server the data back */
    chai.expect(readBody.name, 'Created name').eql('test1');
  });

  it('should create another member', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 2, name: 'test2' };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server the data back */
    chai.expect(readBody.name, 'Created name').eql('test2');
  });

  it('should get all members', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const response = await getData(url);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends [{ id: 1, "name"; "GET test" }, ... ] */
    chai.expect(readBody.length, 'Number returned').to.eql(2);
    chai.expect(readBody[1].id, 'Document 2 id').to.eql(2);
  });
});
