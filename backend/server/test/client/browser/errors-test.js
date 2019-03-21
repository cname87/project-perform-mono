/**
 * This module tests the Express error handling middleware functionality.
 */

let testWindow = {};

function postData(url = '', data = {}) {

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
    return fetch(myRequest, myInit);

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

describe('page not found', function() {

    before('Open dummy page', async function() {

        console.log('Starting page not found tests');

        /* signal server that client 404 test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: '404 test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/dummyUrl&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: '404 test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('ERROR');

    });

    it('should return 404', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('404');

    });

});

describe('page not found - \'production\'', function() {

    before('Open dummy page', async function() {

        console.log('Starting page not found - \'production\' tests');

        /* signal server that client 404 test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: '404-prod test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=404-prod&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: '404-prod test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('ERROR');

    });

    it('should not render a stack', function() {

        const readStack = testWindow.document
            .getElementsByTagName('pre')[0].innerHTML;
        console.log('Stack rendered: ', readStack);
        chai.expect(readStack, 'Stack not rendered').to.eql('');

    });

    it('should return 404', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('404');

    });

});

describe('page not found - \'development\'', function() {

    before('Open ?fail=404-dev', async function() {

        console.log('Starting page not found - \'development\' tests');

        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: '404-dev test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=404-dev&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: '404-dev test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('ERROR');

    });

    it('should render a stack', function() {

        const readStackTitle = testWindow.document
            .getElementsByTagName('pre')[0].innerHTML.split(' ')[0];
        console.log('Stack rendered: ', readStackTitle);
        chai.expect(readStackTitle, 'Stack rendered').to.eql('NotFoundError:');

    });

    it('should return 404', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('404');

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

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=coffee&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Coffee test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should return 418', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('418');

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

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=sent&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Sent test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should return \'Response sent\'', function() {

        /* test returned status */
        const response = testWindow.document
            .getElementsByTagName('body')[0].innerHTML;
        console.log('response: ' + response);
        chai.expect(response).to.eql('Test: Response sent');

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

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=dummy&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Return 404 test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('ERROR');

    });

    it('should return 404', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('404');

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

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=trap-503&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Trap-503 test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('ERROR');

    });

    it('message should be server error', function() {

        /* test returned message */
        const resMessage = testWindow.document
            .getElementsByTagName('h3')[0].innerHTML;
        console.log('response status: ' + resMessage);
        chai.expect(resMessage)
            .to.eql('Error message: \\fail.js: Test error');

    });

    it('should return 503', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('503');

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

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=async-handled&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        /* test server back up */
        await isServerUp();

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Async-handled test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('ERROR');

    });

    it('message should be server error', function() {

        /* test returned message */
        const resMessage = testWindow.document
            .getElementsByTagName('h3')[0].innerHTML;
        console.log('response status: ' + resMessage);
        chai.expect(resMessage)
            .to.eql('Error message: Testing trapped ' +
            'unhandled promise rejection');

    });

    it('should throw a 501 error', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('501');

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

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=error&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        /* test server back up */
        await isServerUp();

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Error test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('ERROR');

    });

    it('message should be server error', function() {

        /* test returned message */
        const resMessage = testWindow.document
            .getElementsByTagName('h3')[0].innerHTML;
        console.log('response status: ' + resMessage);
        chai.expect(resMessage)
            .to.eql('Error message: A server error occurred');

    });

    it('should return 500', function() {

        /* test returned status */
        const resStatus = testWindow.document
            .getElementsByTagName('h3')[1].innerHTML.slice(-3);
        console.log('response status: ' + resStatus);
        chai.expect(resStatus).to.eql('500');

    });

});

describe('cause a view render error', function() {

    before('Open /tests/fail with ?fail=renderError', async function() {

        console.log('Starting fail=renderError test');

        /* signal server that test starting */
        const url = 'https://localhost:1337/raiseEvent';
        const data = {
            number: 1,
            message: 'Render error test start',
        };
        const response = await postData(url, data);
        chai.expect(response.ok).to.eql(true);

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/fail?fail=renderError&timestamp=' + dt, '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        /* test server back up */
        await isServerUp();

        await new Promise(async function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

            const url = 'https://localhost:1337/raiseEvent';
            const data = {
                number: 2,
                message: 'Render error test end',
            };
            const response = await postData(url, data);

            chai.expect(response.ok).to.eql(true);

        });

    });

    it('should have title ERROR', function() {

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('');

    });

    it('should have body message', function() {

        const readBody = testWindow.document
            .getElementsByTagName('body')[0].innerHTML;
        console.log('Page body: ', readBody);
        chai.expect(readBody, 'Page body')
            .to.eql('Internal server error');

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

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

    });

    after('Close window', async function() {

        /* test server back up */
        await isServerUp();

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

        /* test server back up */
        await isServerUp();

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
