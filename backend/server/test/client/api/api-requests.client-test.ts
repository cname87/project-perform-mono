/* import types to avoid text editor tslint errors */
/// <reference types='@types/mocha' />
/// <reference types='@types/chai' />

/**
 * This client-side script sends requests that drive testing the application api paths.
 */

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

async function sendMessage(number: number, message: string) {
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

/* tells the server that tests are ending */
after('Signal tests ending', async () => {
  console.log('Ending tests');
  await sendMessage(2, 'End tests');
});

describe('Api requests', () => {
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
    chai.expect(readTitle, 'Page title').to.eql('Tour of Heroes');
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
