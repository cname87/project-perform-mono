'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('Server operations tests', function() {

    const path = require('path');
    const appRoot = require('app-root-path').toString();
    let { config } = require(path.join(appRoot, 'dist', '.config'));
    const { Server } = config.SERVER;
    const http = require('http');
    const https = require('https');
    const fs = require('fs');
    const express = require('express');
    const chai = require('chai');
    const sinon = require('sinon');
    const sinonChai = require('sinon-chai');

    chai.use(sinonChai);
    const expect = chai.expect;
    sinon.assert.expose(chai.assert, {
        prefix: '',
    });

    //
    /* shared variables */
    const app = express();

    it('Creates a http server', async function() {

        const serverType = http;
        const serverOptions = null;
        const serverPort = 80;

        const server = new Server();
        server.configServer('http');
        server.setupServer(serverType,
                serverOptions, app, serverPort);
        expect(server.expressServer.listening, 'Should return ' +
            'a non-listening server object').to.eql(false);

    });

    it('Creates a https server', function() {

        const serverType = https;
        const serverOptions = {
            key: fs.readFileSync(config.HTTPS_KEY),
            cert: fs.readFileSync(config.HTTPS_CERT),
        };
        const serverPort = config.PORT;

        const server = new Server();
        server.configServer('https');
        server.setupServer(serverType,
            serverOptions, app, serverPort);
        expect(server.expressServer.listening, 'Should return ' +
            'a non-listening server object').to.eql(false);

    });

    it('Fails to creates a server', function() {

        const serverType = https;
        const serverOptions = {
            key: 'dummy',
            cert: 'dummy',
        };
        const serverPort = config.PORT;

        const server = new Server();
        server.configServer('dummy');
        expect(server.setupServer.bind(server.setupServer,
                serverType, serverOptions,
                app, serverPort), 'Should throw an error')
            .to.throw();

    });

    it('Creates a listening server', async function() {

        const serverType = https;
        const serverOptions = {
            key: fs.readFileSync(config.HTTPS_KEY),
            cert: fs.readFileSync(config.HTTPS_CERT),
        };
        const serverPort = config.PORT;

        const server = new Server();
        server.configServer('https');
        server.setupServer(serverType,
            serverOptions, app, serverPort);

        await server.listenServer(serverPort);

        /* copy parameters to be tested and close server before tests */
        const isServerListening = server.expressServer.listening;
        await server.stopServer();

        expect(isServerListening, 'Should create a listening server object')
            .to.eql(true);

    });

    it('Asks a listening server to listen', async function() {

        const serverType = https;
        const serverOptions = {
            key: fs.readFileSync(config.HTTPS_KEY),
            cert: fs.readFileSync(config.HTTPS_CERT),
        };
        const serverPort = config.PORT;

        const server = new Server();
        server.configServer('https');
        server.setupServer(serverType,
            serverOptions, app, serverPort);
        await server.listenServer(serverPort);

        try {

            await server.listenServer(serverPort);

            /* copy parameters to be tested and close server before tests */
            const isServerListening = server.expressServer.listening;
            await server.stopServer();

            expect(isServerListening, 'Should leave a listening server object')
                .to.eql(true);

        } catch (err) {

            expect.fail(1, 0, 'Should not throw an error');

        }

    });

    it('Test listening on an occupied port', async function() {

        const serverType = https;
        const serverOptions = {
            key: fs.readFileSync(config.HTTPS_KEY),
            cert: fs.readFileSync(config.HTTPS_CERT),
        };
        const serverPort = config.PORT;

        const server1 = new Server();
        server1.configServer('https1');
        /* create the first server occupying the port */
        server1.setupServer(serverType,
            serverOptions, app, serverPort);
        await server1.listenServer(serverPort);

        const listenTries = 2;
        const listenTimeout = 3;

        /* create the second server that will request the same port */
        const server2 = new Server();
        server2.configServer('http2');
        server2.setupServer(serverType,
            serverOptions, app, serverPort);

        try {

            await server2.listenServer(serverPort,
                listenTries, listenTimeout);

        } catch (err) {

            /* copy parameters to be tested and close server before tests */
            const isServer1Listening = server1.expressServer.listening;
            const isServer2Listening = server2.expressServer.listening;
            await server1.stopServer();

            /* test server1 still listening */
            expect(isServer1Listening,
                'Should remain a listening server object')
                .to.eql(true);
            /* test server2 not listening */
            expect(isServer2Listening,
                'Should remain a listening server object')
                .to.eql(false);
            /* test that an error is eventually thrown */
            expect(err.message.substring(0, 17), 'Should be ' +
                'a port occupied error').to.eql('listen EADDRINUSE');

        }

    });

    it('Test listening on an occupied port, but clearing port',
                                            async function() {

        const serverType = https;
        const serverOptions = {
            key: fs.readFileSync(config.HTTPS_KEY),
            cert: fs.readFileSync(config.HTTPS_CERT),
        };
        const serverPort = config.PORT;

        /* create the first server occupying the port */
        const server1 = new Server();
        server1.configServer('https1');
        server1.setupServer(serverType,
            serverOptions, app, serverPort);
        await server1.listenServer(serverPort);

        const listenTries = 3;
        const listenTimeout = 3; // in seconds

        /* create the second server that will request the same port */
        const server2 = new Server();
        server2.configServer('http2');
        server2.setupServer(serverType,
            serverOptions, app, serverPort);

        /* set the first server to stop listening */
        setTimeout(async function() {

            await server1.stopServer();

        }, (listenTimeout * 1000) + 100); // set listenTries to 2 minimum

        try {

            await server2.listenServer(serverPort,
                listenTries, listenTimeout);

            /* copy parameters to be tested and close server before tests */
            const isServer1Listening = server1.expressServer.listening;
            const isServer2Listening = server2.expressServer.listening;
            await server2.stopServer();

            expect(isServer2Listening,
                    'Should leave a listening server object')
                    .to.eql(true);
            expect(isServer1Listening,
                    'Should return a non-listening server object')
                    .to.eql(false);

        } catch (err) {

            expect.fail(err, null, 'Should not throw an error');

        }

    });

    it('Attempt to listen but unexpected error thrown',
                                            async function() {

        const serverType = https;
        const serverOptions = {
            key: fs.readFileSync(config.HTTPS_KEY),
            cert: fs.readFileSync(config.HTTPS_CERT),
        };
        const serverPort = config.PORT;

        const server1 = new Server();
        server1.configServer('http1');
        server1.setupServer(serverType,
            serverOptions, app, serverPort);

        /* stub server.listen so a test error can be emitted */
        sinon.stub(server1.expressServer, 'listen').callsFake(listenFake);

        function listenFake(arg) {

            const errTest = {};
            errTest.code = 'Test Error';
            server1.expressServer.emit('error', errTest);

        }

        /* any error other than EADDRINUSE will be immediately thrown */
        const stubError = sinon.stub(console, 'error');
        try {

            await server1.listenServer();

        } catch (err) {

            /* test that an error is eventually thrown */
            expect(err.code, 'Should be test error')
                .to.eql('Test Error');

        }

        expect(server1.expressServer.listening, 'Should equal ' +
            'false').to.eql(false);

        server1.expressServer.listen.restore();

        /* test that there was no console.log output */
        expect(!stubError.called);
        stubError.restore();


    });

    it('Shuts down a server', async function() {

        const serverType = http;
        const serverOptions = null;
        const serverPort = 80;

        const server1 = new Server();
        server1.configServer('http1');
        server1.setupServer(serverType,
            serverOptions, app, serverPort);
        await server1.listenServer(serverPort);

        await server1.stopServer();
        expect(server1.expressServer.listening,
            'Should leave a non-listening server object')
            .to.eql(false);

    });

    it('Shuts down a non-open server', async function() {

        const serverType = http;
        const serverOptions = null;
        const serverPort = 80;

        /* create a listening server */
        const server1 = new Server();
        server1.configServer('http1');
        server1.setupServer(serverType,
            serverOptions, app, serverPort);
        await server1.listenServer(serverPort);
        /* shut down the listening server */
        await server1.stopServer();

        /* stop the server a second time */
        const result = await server1.stopServer();

        expect(server1.expressServer.listening,
            'Should leave a non-listening server object')
            .to.eql(false);
        expect(result.message, 'Should return an error')
            .to.eql('Server is not running.');

    });

});
