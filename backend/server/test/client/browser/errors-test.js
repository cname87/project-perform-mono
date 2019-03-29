/**
 * This module tests the Express error handling middleware functionality.
 */

let testWindow = {};

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

    return await fetch(myRequest, myInit);

};

async function getData(url = '') {

  const myRequest = new Request(url);
  const myInit = {
      method: 'GET',
      cache: 'no-cache',
      credentials: 'omit',
  };

  return await fetch(myRequest, myInit);

};


/* sleep utility */
function sleep(delay = 100){

    return new Promise(async function(resolve, reject) {

        setTimeout(() => {
            resolve();
        }, delay)

    });

}

/* tells the server that tests are ending */
async function isServerUp() {

    const testServer = () => {

        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 2,
            message: 'Check server up',
        };

        return new Promise(async function(resolve, reject) {

            for (let tryConnectCount = 1;
                tryConnectCount <= 3; tryConnectCount++) {

                try {

                    console.log('Connecting to local host' +
                        ` - attempt ${tryConnectCount}`);
                    const answer = await postData(url, data);
                    resolve(answer);
                    break; // loop will continue even though promise resolved

                } catch (err) {

                    console.log('Failed to connect to local host' +
                        ` - attempt ${tryConnectCount}`);
                    await sleep(1000);
                    continue;

                }

            }

            /* if loop ends without earlier resolve() */
            reject(new Error('Connection failed'));

        });

    };

    try {
        const answer = await testServer();
        console.log('Connected to server');
        chai.expect(answer.ok).to.eql(true);
        return;
    } catch (err) {
        console.error(err.message);
        chai.expect(false).to.eql(true);
        return;
    }

};

async function closeTest (number, message) {

  await new Promise(async function(resolve) {

      const url = 'https://localhost:1337/raiseEvent';
      const data = {
          number: number,
          message: message,
      };
      const response = await postData(url, data);

      chai.expect(response.ok).to.eql(true);

      resolve();

  });

};

describe('page not found', function() {

    before('Send get dummy page', async function() {

        console.log('Starting page not found tests');

        /* signal server that client 404 test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: '404 test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

    });

    after('Close test', async () => {
        await closeTest(2, '404 test end')
    });

    it('should have body with code: 404', async function() {

        /* /dummyUrl set to go to 404 i.e. not to Angular front end */
        const url = 'https://localhost:1337/dummyUrl';
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        /* the body should match what was sent by the server */
        const readBody = await response.json();
        console.log('Page body : ', readBody);
        /* the server sends { code: 404, ... } */
        chai.expect(readBody.code, 'Body code').to.eql(404);

    });

    it('should return 404', async function() {

        /* /dummyUrl set to go to 404 i.e. not to Angular front end */
        const url = 'https://localhost:1337/dummyUrl';
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        /* the http response should report 404 */
        console.log('response status: ' + response.status);
        chai.expect(response.status).to.eql(404);

    });

});

describe('coffee not found - return 418', function() {

    before('Open /tests/fail with ?fail=coffee', async function() {

        console.log('Starting fail=coffee test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Coffee test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

        });

    after('Close test', async () => {
      await closeTest(2, 'Coffee test end')
    });

    it('should have body with code: 418', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=coffee&timestamp' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        /* the body should match what was sent by the server */
        const readBody = await response.json();
        console.log('Page body : ', readBody);
        chai.expect(readBody.code, 'Body code').to.eql(418);

    });

    it('should return 418', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=coffee&timestamp' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        console.log('response status: ' + response.status);
        chai.expect(response.status).to.eql(418);

    });

});

describe('response sent twice', function() {

    before('Open /tests/fail with ?fail=sent', async function() {

        console.log('Starting fail=sent test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Sent test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

    });

    after('Close test', async () => {
      await closeTest(2, 'Sent test end')
    });

    it('should return \'Response sent\'', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=sent&timestamp=' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(true);

        /* the body should match what was sent by the server */
        const readBody = await response.json();
        console.log('Page body : ', readBody);
        chai.expect(readBody.message, 'Body message')
          .to.eql('Test: Response sent');

    });

});

describe('throw a specific error', function() {

    before('Open /tests/fail with ?fail=trap-503', async function() {

        console.log('Starting fail=trap-503 test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Trap-503 test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

    });

    after('Close test', async () => {
      await closeTest(2, 'Trap-503 test end')
    });


    it('should have body with code: 503', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=trap-503&timestamp=' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        /* the body should match what was sent by the server */
        const readBody = await response.json();
        console.log('Page body : ', readBody);
        chai.expect(readBody.code, 'Body code').to.eql(503);

    });

    it('should return 503', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=trap-503&timestamp=' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        console.log('response status: ' + response.status);
        chai.expect(response.status).to.eql(503);

    });

});

describe('trap an unhandled promise rejection ' +
        'and throw a specific error', function() {

    before('Open /tests/fail with ?fail=async-handled', async function() {

        console.log('Starting fail=async-handled test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Async-handled test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

    });

    after('Close test', async function() {

        await closeTest(2, 'Async-handled test end')

    });

    it('should have body code: 501', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=async-handled&timestamp=' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        /* the body should match what was sent by the server */
        const readBody = await response.json();
        console.log('Page body : ', readBody);
        chai.expect(readBody.code, 'Body code').to.eql(501);

    });

    it('should return 501', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=async-handled&timestamp=' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        console.log('response status: ' + response.status);
        chai.expect(response.status).to.eql(501);

    });

});

describe('throw an error', function() {

    before('Open /tests/fail with ?fail=error', async function() {

        console.log('Starting fail=error test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Error test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

    });

    after('Close window', async function() {

        /* test server back up */
        await sleep(1100); // delay as error handler delays before calling process.exit
        await closeTest(2, 'Error test end')

    });

    it('should have body as sent', async function() {

        const dt = new Date().toString();
        const url = 'https://localhost:1337/testServer/fail?fail=error&timestamp=' + dt;
        const response = await getData(url);
        chai.expect(response.ok).to.eql(false);

        /* the body should match what was sent by the server */
        const readBody = await response.json();
        console.log('Page body : ', readBody);
        chai.expect(readBody.code, 'Body code').to.eql(500);

    });

    it('should return 500', async function() {

      const dt = new Date().toString();
      const url = 'https://localhost:1337/testServer/fail?fail=error&timestamp=' + dt;
      const response = await getData(url);
      chai.expect(response.ok).to.eql(false);

      console.log('response status: ' + response.status);
      chai.expect(response.status).to.eql(500);

    });

});

describe('unhandled promise rejection', function() {

    before('Open /tests/fail with ?fail=sync', async function() {

        console.log('Starting fail=sync test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Async test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=async&timestamp=' + dt, '_blank');

    });

    after('Close window', async function() {

      await sleep(1100); // delay ato match delays calling process.exit

      await new Promise(async function(resolve) {

        setTimeout(() => {

            testWindow.close();
            resolve();

        }, 500);

        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 2,
            message: 'Async test end',
        };
        const response = await postData(url, data);

        chai.expect(response.ok).to.eql(true);

      });

    });

    it('should have body message', function() {

        const readBody = testWindow.document
            .getElementsByTagName('body')[0].innerHTML;
        console.log('Page body: ', readBody);
        chai.expect(readBody, 'Page body')
            .to.eql('Test: ' +
            'Server shutting down due to unhandled promise rejection');

    });

});

describe('server crash', function() {

    before('Open /tests/fail with ?fail=crash', async function() {

        console.log('Starting fail=crash test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Crash test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=crash&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

      await sleep(1100); // delay as errorhandler delays before calling process.exit

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Crash test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have body message', function() {

        const readBody = testWindow.document
            .getElementsByTagName('body')[0].innerHTML;
        console.log('Page body: ', readBody);
        chai.expect(readBody, 'Page body')
            .to.eql('Test: Server shutting down due to process.exit');

    });


});

describe('fail query not recognised', function() {

  before('Open with ?fail=dummy', async function() {

      console.log('Starting fail=dummy test');

      const url = 'https://localhost:1337/raiseEvent';
      const data = {
          number: 1,
          message: 'Return 404 test start',
      };
      const response = await postData(url, data);
      chai.expect(response.ok).to.eql(true);

  });

  after('Close test', async () => {
    await closeTest(2, 'Return 404 test end')
  });

  it('should have body with code: 404', async function() {

      const dt = new Date().toString();
      const url = 'https://localhost:1337/testServer/fail?fail=dummy&timestamp=' + dt;
      const response = await getData(url);
      chai.expect(response.ok).to.eql(false);

      /* the body should match what was sent by the server */
      const readBody = await response.json();
      console.log('Page body : ', readBody);
      /* the server sends { code: 404, ... } */
      chai.expect(readBody.code, 'Body code').to.eql(404);

  });

  it('should return 404', async function() {

      const dt = new Date().toString();
      const url = 'https://localhost:1337/testServer/fail?fail=dummy&timestamp=' + dt;
      const response = await getData(url);
      chai.expect(response.ok).to.eql(false);

      /* the http response should report 404 */
      console.log('response status: ' + response.status);
      chai.expect(response.status).to.eql(404);

  });

});
