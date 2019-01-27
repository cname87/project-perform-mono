
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

/* sleep utility */
function sleep(delay = 100){

    return new Promise(async function(resolve, reject) {

        setTimeout(() => {
            resolve();
        }, delay)

    });

}

/* tells the server that tests are starting */
before('signal server', async function() {

    const url = 'https://localhost:1337/raiseEvent';
    const data = {
        number: 1,
        message: 'Start tests',
    };
    const response = await postData(url, data);

    chai.expect(response.ok).to.eql(true);

});

/* tells the server that tests are ending */
after('close server', async function() {

    const url = 'https://localhost:1337/raiseEvent';
    const data = {
        number: 2,
        message: 'End tests',
    };

    const serverIsUp = () => {

        return new Promise(async function(resolve, reject) {

            for (let tryConnectCount = 1;
                tryConnectCount <= 20; tryConnectCount++) {

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
        const answer = await serverIsUp();
        console.log('Connected to server');
        chai.expect(answer.ok).to.eql(true);
        return;
    } catch (err) {
        console.error(err.message);
        chai.expect(false).to.eql(true);
        return;
    }

});
