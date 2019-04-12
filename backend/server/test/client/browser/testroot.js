
/**
 * This module provides before and after functions
 * for all client tests.
 */

/* sends the data in a fetch request */
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

    return fetch(myRequest, myInit);

};


/* tells the server that tests are starting */
before('signal server to start tests', async function() {

    const url = 'https://localhost:1337/raiseEvent';
    const data = {
        number: 1,
        message: 'Start tests',
    };
    const response = await postData(url, data);

    chai.expect(response.ok).to.eql(true);

});

/* tells the server that tests are ending */
after('signal server to end tests', async function() {

    const url = 'https://localhost:1337/raiseEvent';
    const data = {
        number: 2,
        message: 'End tests',
    };
    const response = await postData(url, data);

    chai.expect(response.ok).to.eql(true);

});
