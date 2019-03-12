/**
 * This module tests favicon functionality.
 */

describe('file retrieval', function() {

    let testWindow = {};
    let response = {};

    before( async function() {

        console.log('Starting file retrieval tests');

    });

    after('Close page', async function() {

        await new Promise(function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

        });

    });

    it('should receive an x-icon content type', async function() {

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/testServer/pagetest.html' +
            '?timestamp=' + dt,
        '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });


        const myInit = {
            method: 'GET',
            cache: 'no-store',
        };

        /* download the favicon */
        const myRequest = new Request('https://localhost:1337/testServer/filetest.ico');

        response = await fetch(myRequest, myInit);

        /* display favicon image */
        const myImage = testWindow.document.querySelector('img');
        const myBlob = await response.blob();
        const objectURL = URL.createObjectURL(myBlob);
        myImage.src = objectURL;

        /* test content type */
        const contentType = response.headers.get('content-type');
        console.log('favicon content type: ' + contentType);
        chai.expect(contentType, 'response content type')
            .to.eql('image/x-icon');

    });

    it('should receive a 200 response',
        async function() {

            /* display status response */
            const para = testWindow.document.createElement('p');
            const node = testWindow.document
                .createTextNode('response.status: ' + response.status);
            para.appendChild(node);
            const div1 = testWindow.document.getElementById('div1');
            div1.appendChild(para);

            /* test returned status */
            console.log('response status: ' + response.status);
            chai.expect(response.status).to.eql(200);

    });

});
