/**
 * This module tests the root ('/') webpage.
 */

describe('test page', function() {

    let testWindow = {};

    before( () => {

        console.log('Starting test page tests');

    });

    after( async function() {

        await new Promise(function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

        });

    });

    it('should download a page with title \'Test Title\'', async function() {

        const dt = new Date().toString();
        testWindow = window.open(
          'https://localhost:1337/testServer/pagetest.html' +
          '?timestamp=' + dt, '_blank'
        );

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('Test Title');

    });

});
