/* import types to avoid text editor tslint errors */
/// <reference types='@types/mocha' />
/// <reference types='@types/chai' />

/**
 * This client-side script sends requests that drive testing the application api paths.
 */

async function sendRequest(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?:
    | { name: string }
    | { id: number; name: string }
    | { number: number; message: string },
) {
  const myRequest = new Request(url);
  const headers = data
    ? {
        'Content-Type': 'application/json; charset=utf-8',
      }
    : undefined;
  const body = data ? JSON.stringify(data) : undefined;

  const myInit: RequestInit = {
    method,
    cache: 'no-cache',
    credentials: 'omit',
    headers,
    body,
  };
  const fetched = await fetch(myRequest, myInit);
  return fetched;
}

async function sendMessage(number: number, message: string) {
  await new Promise(async (resolve) => {
    const url = 'https://localhost:1337/raiseEvent';
    const data = {
      number,
      message,
    };
    const response = await sendRequest(url, 'POST', data);

    chai.expect(response.ok).to.eql(true);

    resolve();
  });
}

/* tells the server that tests are ending */
after('Signal tests ending', async () => {
  console.log('Ending tests');
  await sendMessage(2, 'End tests');
});

describe('api requests', () => {
  const duplicateName = 'test2';

  before('Signal tests starting', async () => {
    console.log('Starting API requests tests');
    await sendMessage(1, 'API tests start');
  });

  after('Signal tests ending', async () => {
    console.log('Ending API requests tests');
    await sendMessage(2, 'API tests end');
  });

  it('should delete all members', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { count: n } */
    chai.expect(readBody.count, 'Number deleted').to.be.above(-1);
  });

  it('should create a member', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { name: 'test1' };
    const response = await sendRequest(url, 'POST', data);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server the data back */
    chai.expect(readBody.name, 'Created name').eql('test1');
  });

  it('should create another member', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { name: duplicateName };
    const response = await sendRequest(url, 'POST', data);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server the data back */
    chai.expect(readBody.name, 'Created name').eql(duplicateName);
  });

  it('should create a member with duplicate name', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { name: duplicateName };
    const response = await sendRequest(url, 'POST', data);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server the data back */
    chai.expect(readBody.name, 'Created name').eql(duplicateName);
  });

  it('should get all members', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends [{ id: 1, "name"; "test1" }, ... ] */
    chai.expect(readBody.length, 'Number returned').to.eql(3);
    chai.expect(readBody[1].id, 'Document 2 id').to.eql(2);
  });

  it('should get queried members', async () => {
    const url = `https://localhost:1337/api-v1/members?name=${duplicateName}`;
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends [{ id: 1, "name"; "test1" }, ... ] */
    chai.expect(readBody.length, 'Number returned').to.eql(2);
    chai.expect(readBody[1].id, 'Document 2 id').to.eql(3);
  });

  it('should update a member', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 2, name: 'test2_updated' };
    const response = await sendRequest(url, 'PUT', data);
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { id: 2, "name"; "test2_updated" } */
    chai.expect(readBody.id, 'Document id').to.eql(2);
    chai.expect(readBody.name, 'Document name').to.eql('test2_updated');
  });

  it('should get a member', async () => {
    const url = 'https://localhost:1337/api-v1/members/2';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { id: 2, "name"; "test2_updated" } */
    chai.expect(readBody.id, 'Document id').to.eql(2);
    chai.expect(readBody.name, 'Document name').to.eql('test2_updated');
  });

  it('should delete a member', async () => {
    const url = 'https://localhost:1337/api-v1/members/2';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { count: 1} } */
    chai.expect(readBody.count, 'Delete count').to.eql(1);
  });

  it('should delete all members', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(true);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { count: n } */
    chai.expect(readBody.count, 'Number deleted').to.eql(2);
  });
});

describe('failed api requests', () => {
  before('Signal tests starting', async () => {
    console.log('Starting failed API requests tests');
    await sendMessage(1, 'Failed API tests start');
  });

  after('Signal tests ending', async () => {
    console.log('Ending failed API requests tests');
    await sendMessage(2, 'Failed API tests end');
  });

  it('should fail to read - not there ', async () => {
    let url = 'https://localhost:1337/api-v1/members/997';
    let response = await sendRequest(url, 'DELETE');

    url = 'https://localhost:1337/api-v1/members/997';
    response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(404);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'member not found')
      .eql('The supplied member ID does not match a stored member');
  });

  it('should fail to update - not there ', async () => {
    let url = 'https://localhost:1337/api-v1/members/4';
    let response = await sendRequest(url, 'DELETE');

    url = 'https://localhost:1337/api-v1/members';
    const data = { id: 4, name: 'test4_create_updated' };
    response = await sendRequest(url, 'PUT', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(404);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'member not found')
      .eql('The supplied member ID does not match a stored member');
  });

  it('should fail to delete - not there ', async () => {
    let url = 'https://localhost:1337/api-v1/members/997';
    let response = await sendRequest(url, 'DELETE');

    url = 'https://localhost:1337/api-v1/members/997';
    response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(404);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'member not found')
      .eql('The supplied member ID does not match a stored member');
  });

  it('should fail to read all - matchstring matches nothing', async () => {
    /* create a member so database definitely not empty */
    let url = 'https://localhost:1337/api-v1/members';
    const data = { name: 'test9' };
    let response = await sendRequest(url, 'POST', data);

    url = 'https://localhost:1337/api-v1/members?name=xxx';
    response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(404);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'no member found')
      .eql(
        'No members found: The supplied match string does not match any stored members, or no matchstring supplied and no members are stored',
      );
  });

  it('should fail to read all - empty ', async () => {
    /* delete all */
    let url = 'https://localhost:1337/api-v1/members';
    let response = await sendRequest(url, 'DELETE');

    url = 'https://localhost:1337/api-v1/members';
    response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(404);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'no member found')
      .eql(
        'No members found: The supplied match string does not match any stored members, or no matchstring supplied and no members are stored',
      );
  });
});

describe('bad database tests', () => {
  before('Signal  starting', async () => {
    console.log('Starting bad database tests');
    await sendMessage(1, 'Bad database tests start');
  });

  after('Signal tests ending', async () => {
    console.log('Ending bad database tests');
    await sendMessage(2, 'Bad database tests end');
  });

  it('should fail to create - bad database', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { name: 'test8' };
    const response = await sendRequest(url, 'POST', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(503);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'bad database')
      .eql('The database service is unavailable');
  });

  it('should fail to get one - bad database ', async () => {
    const url = 'https://localhost:1337/api-v1/members/1';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(503);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'bad database')
      .eql('The database service is unavailable');
  });

  it('should fail to get all - bad database ', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(503);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'bad database')
      .eql('The database service is unavailable');
  });

  it('should fail to update - bad database', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 1, name: 'test1' };
    const response = await sendRequest(url, 'PUT', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(503);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'bad database')
      .eql('The database service is unavailable');
  });

  it('should fail to delete one - bad database ', async () => {
    const url = 'https://localhost:1337/api-v1/members/1';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(503);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'bad database')
      .eql('The database service is unavailable');
  });

  it('should fail to delete all - bad database ', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(503);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'bad database')
      .eql('The database service is unavailable');
  });
});

describe('invalid api requests', () => {
  before('Signal tests starting', async () => {
    console.log('Starting invalid API requests tests');
    await sendMessage(1, 'Invalid API requests tests start');
  });

  after('Signal tests ending', async () => {
    console.log('Ending invalid API requests tests');
    await sendMessage(2, 'Invalid API requests tests end');
  });

  it('should fail to create - name too long', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 1, name: '0123456789012345678901234567890123456789' };
    const response = await sendRequest(url, 'POST', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to create - missing property', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = {} as any;
    const response = await sendRequest(url, 'POST', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to update - id > max', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 1001, name: 'test2_updated' };
    const response = await sendRequest(url, 'PUT', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to update - id < 0', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: -13, name: 'test2_updated' };
    const response = await sendRequest(url, 'PUT', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to update - name too long', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 1, name: '0123456789012345678901234567890123456789' };
    const response = await sendRequest(url, 'PUT', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to update - missing property', async () => {
    const url = 'https://localhost:1337/api-v1/members';
    const data = { id: 1 } as any;
    const response = await sendRequest(url, 'PUT', data);
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to get - query too long', async () => {
    const url =
      'https://localhost:1337/api-v1/members?name=0123456789012345678901234567890123456789';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to get - id > max', async () => {
    const url = 'https://localhost:1337/api-v1/members/1001';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to get - id < 0', async () => {
    const url = 'https://localhost:1337/api-v1/members/-13';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to get - id not a number', async () => {
    const url = 'https://localhost:1337/api-v1/members/x';
    const response = await sendRequest(url, 'GET');
    chai.expect(response.ok).to.eql(false);
    chai.expect(response.status).to.eql(400);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to delete id > max', async () => {
    const url = 'https://localhost:1337/api-v1/members/1001';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(false);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to delete id < 0', async () => {
    const url = 'https://localhost:1337/api-v1/members/-13';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(false);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });

  it('should fail to delete id not a number', async () => {
    const url = 'https://localhost:1337/api-v1/members/x';
    const response = await sendRequest(url, 'DELETE');
    chai.expect(response.ok).to.eql(false);

    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai
      .expect(readBody.message, 'API validation fail')
      .eql('API validation fail');
  });
});

describe('fall back to the angular index.html', () => {
  let testWindow: Window;

  before('Signal tests starting', async () => {
    console.log('Starting angular index.html fall back test');
    await sendMessage(1, 'Angular fall back test start');
  });

  after('Close window and signal tests ending', async () => {
    console.log('Closing window');
    await new Promise((resolve) => {
      setTimeout(() => {
        testWindow.close();
        resolve();
      }, 500);
    });
    console.log('Ending API requests tests');
    await sendMessage(2, 'Angular fall back test end');
  });

  /* tests a path not recognised by angular frontend */
  it('should fall back to angular index.html', async () => {
    const dt = new Date().toString();
    testWindow = window.open(
      'https://localhost:1337/notfound.html' + '?timestamp=' + dt,
      '_blank',
    ) as Window;

    if (!testWindow) {
      throw new Error('Window did not open');
    }

    await new Promise((resolve) => {
      testWindow.onload = () => {
        resolve();
      };
    });

    const readTitle = testWindow.document.title;
    console.log('Page title: ', readTitle);
    chai.expect(readTitle, 'Page title').to.eql('Team Members');
  });
});

describe('page and file retrieval', () => {
  let testWindow: Window;
  let response: Response;

  before('Signal tests starting', async () => {
    console.log('Starting file retrieval tests');
    await sendMessage(1, 'File retrieval test start');
  });

  afterEach('Close window and signal tests ending', async () => {
    console.log('Closing window');
    await new Promise((resolve) => {
      setTimeout(() => {
        testWindow.close();
        resolve();
      }, 500);
    });
    console.log('Ending file retrieval test');
    await sendMessage(2, 'File retrieval test end');
  });

  it("should download a page with title 'Test Title'", async () => {
    const dt = new Date().toString();
    testWindow = window.open(
      'https://localhost:1337/testServer/api/static/pagetest.html' +
        '?timestamp=' +
        dt,
      '_blank',
    ) as Window;

    if (!testWindow) {
      throw new Error('Window did not open');
    }

    await new Promise((resolve) => {
      testWindow.onload = () => {
        resolve();
      };
    });

    const readTitle = testWindow.document.title;
    console.log('Page title: ', readTitle);
    chai.expect(readTitle, 'Page title').to.eql('Test Title');
  });

  it('should download and file receive an x-icon content type', async () => {
    const dt = new Date().toString();
    testWindow = window.open(
      'https://localhost:1337/testServer/api/static/pagetest.html' +
        '?timestamp=' +
        dt,
      '_blank',
    ) as Window;

    if (!testWindow) {
      throw new Error('Window did not open');
    }

    await new Promise((resolve) => {
      testWindow.onload = () => {
        resolve();
      };
    });

    const myInit: RequestInit = {
      method: 'GET',
      cache: 'no-store',
    };

    /* download the favicon */
    const myRequest = new Request(
      'https://localhost:1337/testServer/api/static/filetest.ico',
    );

    response = await fetch(myRequest, myInit);

    /* display favicon image */
    const myImage = testWindow.document.querySelector('img');
    const myBlob = await response.blob();
    const objectURL = URL.createObjectURL(myBlob);
    if (myImage) {
      myImage.src = objectURL;
    } else {
      throw new Error('Image not returned');
    }

    /* test content type */
    const contentType = response.headers.get('content-type');
    console.log('favicon content type: ' + contentType);
    chai.expect(contentType, 'response content type').to.eql('image/x-icon');
  });
});

export {};
