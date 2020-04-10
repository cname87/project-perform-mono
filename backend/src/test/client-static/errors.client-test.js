/**
 * This client-side script tests the Express error handling middleware functionality.
 */

let testWindow;

const PORT = 8080;
const HOST = `http://localhost:${PORT}/`;

async function postData(url = '', data = {}) {
  const myRequest = new Request(url);
  const myInit = {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
  };

  // @ts-ignore
  const response = await fetch(myRequest, myInit);
  return response;
}

async function getData(url = '') {
  const myRequest = new Request(url);
  const myInit = {
    method: 'GET',
    cache: 'no-cache',
    credentials: 'omit',
  };

  // @ts-ignore
  const response = await fetch(myRequest, myInit);
  return response;
}

/* sleep utility */
function sleep(delay = 100) {
  return new Promise(async (resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

async function closeTest(number, message) {
  await new Promise(async (resolve) => {
    const url = `${HOST}raiseEvent`;
    const data = {
      number,
      message,
    };
    const response = await postData(url, data);

    chai.expect(response.ok).to.eql(true);

    resolve();
  });
}

/* tells the server that tests are starting */
before('signal server to start tests', async () => {
  const url = `${HOST}raiseEvent`;
  const data = {
    number: 1,
    message: 'Start tests',
  };
  const response = await postData(url, data);

  chai.expect(response.ok).to.eql(true);
});

/* tells the server that tests are ending */
after('signal server to end tests', async () => {
  const url = `${HOST}raiseEvent`;
  const data = {
    number: 2,
    message: 'End tests',
  };
  const response = await postData(url, data);

  chai.expect(response.ok).to.eql(true);
});

describe('page not found', () => {
  before('Send get dummy page', async () => {
    console.log('Starting page not found tests');

    /* signal server that client 404 test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: '404 test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Close test', async () => {
    await closeTest(2, '404 test end');
  });

  it('should have body with code: 404', async () => {
    /* /dummyUrl set to go to 404 i.e. not to Angular front end */
    const url = `${HOST}dummyUrl`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the body should match what was sent by the server */
    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { code: 404, ... } */
    chai.expect(readBody.code, 'Body code').to.eql(404);
  });

  it('should return 404', async () => {
    /* /dummyUrl set to go to 404 i.e. not to Angular front end */
    const url = `${HOST}dummyUrl`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the http response should report 404 */
    console.log(`response status: ${response.status}`);
    chai.expect(response.status).to.eql(404);
  });
});

describe('coffee not found - return 418', () => {
  before('Open /tests/fail with ?fail=coffee', async () => {
    console.log('Starting fail=coffee test');

    /* signal server that test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Coffee test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Close test', async () => {
    await closeTest(2, 'Coffee test end');
  });

  it('should have body with code: 418', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=coffee&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the body should match what was sent by the server */
    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai.expect(readBody.code, 'Body code').to.eql(418);
  });

  it('should return 418', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=coffee&timestamp${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    console.log(`response status: ${response.status}`);
    chai.expect(response.status).to.eql(418);
  });
});

describe('response sent twice', () => {
  before('Open /tests/fail with ?fail=sent', async () => {
    console.log('Starting fail=sent test');

    /* signal server that test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Sent test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Close test', async () => {
    await closeTest(2, 'Sent test end');
  });

  it("should return 'Response sent'", async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=sent&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(true);

    /* the body should match what was sent by the server */
    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai.expect(readBody.message, 'Body message').to.eql('Test: Response sent');
  });
});

describe('throw a specific error', () => {
  before('Open /tests/fail with ?fail=trap-503', async () => {
    console.log('Starting fail=trap-503 test');

    /* signal server that test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Trap-503 test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Close test', async () => {
    await closeTest(2, 'Trap-503 test end');
  });

  it('should have body with code: 503', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=trap-503&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the body should match what was sent by the server */
    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai.expect(readBody.code, 'Body code').to.eql(503);
  });

  it('should return 503', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=trap-503&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    console.log(`response status: ${response.status}`);
    chai.expect(response.status).to.eql(503);
  });
});

describe('trap a promise rejection and throw a specific error', () => {
  before('Open /tests/fail with ?fail=async-handled', async () => {
    console.log('Starting fail=async-handled test');

    /* signal server that test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Async-handled test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Close test', async () => {
    await closeTest(2, 'Async-handled test end');
  });

  it('should have body code: 501', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=async-handled&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the body should match what was sent by the server */
    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai.expect(readBody.code, 'Body code').to.eql(501);
  });

  it('should return 501', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=async-handled&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    console.log(`response status: ${response.status}`);
    chai.expect(response.status).to.eql(501);
  });
});

describe('throw an error', () => {
  before('Open /tests/fail with ?fail=error', async () => {
    console.log('Starting fail=error test');

    /* signal server that test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Error test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Close window', async () => {
    /* test server back up */
    await sleep(1100); // delay as error handler delays before calling process.exit
    await closeTest(2, 'Error test end');
  });

  it('should have body as sent', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=error&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the body should match what was sent by the server */
    const readBody = await response.json();
    console.log('Page body : ', readBody);
    chai.expect(readBody.code, 'Body code').to.eql(500);
  });

  it('should return 500', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=error&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    console.log(`response status: ${response.status}`);
    chai.expect(response.status).to.eql(500);
  });
});

describe('unhandled promise rejection', () => {
  before('Open /tests/fail with ?fail=async', async () => {
    console.log('Starting fail=async test');

    /* signal server that test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Async test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);

    const dt = new Date().toString();
    testWindow = window.open(
      `${HOST}testServer/fail?fail=async&timestamp=${dt}`,
      '_blank',
    );

    if (!testWindow) {
      throw new Error('Window did not open');
    }

    await new Promise((resolve) => {
      testWindow.onload = () => {
        resolve();
      };
    });
  });

  after('Close window', async () => {
    await sleep(1500); // delay to match delays calling process.exit

    await new Promise(async (resolve) => {
      setTimeout(() => {
        testWindow.close();
        resolve();
      }, 500);

      const url = `${HOST}raiseEvent`;
      const data = {
        number: 2,
        message: 'Async test end',
      };
      const response = await postData(url, data);

      chai.expect(response.ok).to.eql(true);
    });
  });

  it('should have body message', () => {
    const readBody = testWindow.document.getElementsByTagName('body')[0]
      .innerHTML;
    console.log('Page body: ', readBody);
    chai
      .expect(readBody, 'Page body')
      .to.eql('Test: Server shutting down due to unhandled promise rejection');
  });
});

describe('server crash', () => {
  before('Open /tests/fail with ?fail=crash', async () => {
    console.log('Starting fail=crash test');

    /* signal server that test starting */
    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Crash test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);

    const dt = new Date().toString();
    testWindow = window.open(
      `${HOST}testServer/fail?fail=crash&timestamp=${dt}`,
      '_blank',
    );

    if (!testWindow) {
      throw new Error('Window did not open');
    }

    await new Promise((resolve) => {
      testWindow.onload = () => {
        resolve();
      };
    });
  });

  after('Close window', async () => {
    await sleep(1500); // delay as error handler delays before calling process.exit

    await new Promise(async (resolve) => {
      setTimeout(() => {
        testWindow.close();
        resolve();
      }, 500);

      const url = `${HOST}raiseEvent`;
      const data = {
        number: 2,
        message: 'Crash test end',
      };
      const response = await postData(url, data);

      chai.expect(response.ok).to.eql(true);
    });
  });

  it('should have body message', () => {
    const readBody = testWindow.document.getElementsByTagName('body')[0]
      .innerHTML;
    console.log('Page body: ', readBody);
    chai
      .expect(readBody, 'Page body')
      .to.eql('Test: Server shutting down due to process.exit');
  });
});

describe('fail query not recognised', () => {
  before('Open with ?fail=dummy', async () => {
    console.log('Starting fail=dummy test');

    const url = `${HOST}raiseEvent`;
    const data = {
      number: 1,
      message: 'Return 404 test start',
    };
    const response = await postData(url, data);
    chai.expect(response.ok).to.eql(true);
  });

  after('Close test', async () => {
    await closeTest(2, 'Return 404 test end');
  });

  it('should have body with code: 404', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=dummy&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the body should match what was sent by the server */
    const readBody = await response.json();
    console.log('Page body : ', readBody);
    /* the server sends { code: 404, ... } */
    chai.expect(readBody.code, 'Body code').to.eql(404);
  });

  it('should return 404', async () => {
    const dt = new Date().toString();
    const url = `${HOST}testServer/fail?fail=dummy&timestamp=${dt}`;
    const response = await getData(url);
    chai.expect(response.ok).to.eql(false);

    /* the http response should report 404 */
    console.log(`response status: ${response.status}`);
    chai.expect(response.status).to.eql(404);
  });
});

export {};
