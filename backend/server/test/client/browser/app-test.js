/**
 * This module tests fall back to the angular app.
 */

describe('fall back to the angular index.html', function() {

    let testWindow = {};

    before( async function() {

        console.log('Starting angular index.html fall back test');

    });

    after('Close page', async function() {

        await new Promise(function(resolve) {

            setTimeout(() => {

                testWindow.close();
                resolve();

            }, 500);

        });

    });

    it('should fall back to angular index.html', async function() {

        const dt = new Date().toString();
        testWindow = window.open('https://localhost:1337/notfound.html' +
            '?timestamp=' + dt,
        '_blank');

        await new Promise(function(resolve) {

            testWindow.onload = function() {

                resolve();

            };

        });

        const readTitle = testWindow.document.title;
        console.log('Page title: ', readTitle);
        chai.expect(readTitle, 'Page title').to.eql('AngularTourOfHeroes');

    });

});
