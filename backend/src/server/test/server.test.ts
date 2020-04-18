import { setupDebug } from '../../utils/src/debugOutput';

import { configServer } from '../../configServer';
import { Server } from '../server';

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import http from 'http';
import express from 'express';

setupDebug(__filename);
chai.use(sinonChai);
const { expect } = chai;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

describe('Server operations tests', () => {
  /* shared variables */
  const app = express();

  it('Creates a http server', async () => {
    const serverType = http;
    const serverOptions = null;
    const svrName = 'testName';

    const server = new Server();
    server.configureServer(svrName);
    server.setupServer(serverType, serverOptions, app);
    expect(
      server.expressServer.listening,
      'Should return ' + 'a non-listening server object',
    ).to.eql(false);
    expect(server.name).to.eql(svrName);
  });

  it('Fails to creates a server', () => {
    const serverType = {}; // will cause an error to be thrown
    const serverOptions = {};

    const server = new Server();
    expect(
      server.setupServer.bind(
        server.setupServer,
        serverType,
        serverOptions,
        app,
      ),
      'Should throw an error',
    ).to.throw();
  });

  it('Creates a listening server', async () => {
    const serverType = http;
    const serverOptions = {};
    const serverPort = configServer.PORT;

    const server = new Server();
    server.configureServer();
    server.setupServer(serverType, serverOptions, app);

    await server.listenServer(serverPort);

    /* copy parameters to be tested and close server before tests */
    const isServerListening = server.expressServer.listening;
    await server.stopServer();

    expect(isServerListening, 'Should create a listening server object').to.eql(
      true,
    );
  });

  it('Asks a listening server to listen', async () => {
    const serverType = http;
    const serverOptions = {};
    const serverPort = configServer.PORT;

    const server = new Server();
    server.setupServer(serverType, serverOptions, app);
    await server.listenServer(serverPort);

    try {
      await server.listenServer(serverPort);

      /* copy parameters to be tested and close server before tests */
      const isServerListening = server.expressServer.listening;
      await server.stopServer();

      expect(
        isServerListening,
        'Should leave a listening server object',
      ).to.eql(true);
    } catch (err) {
      expect.fail('Should not throw an error');
    }
  });

  it('Test listening on an occupied port', async () => {
    const serverType = http;
    const serverOptions = {};
    const serverPort = configServer.PORT;

    const server1 = new Server();
    /* create the first server occupying the port */
    server1.setupServer(serverType, serverOptions, app);
    await server1.listenServer(serverPort);

    const listenTries = 2;
    const listenTimeout = 3;

    /* create the second server that will request the same port */
    const server2 = new Server();
    server2.setupServer(serverType, serverOptions, app);

    try {
      await server2.listenServer(serverPort, listenTries, listenTimeout);
    } catch (err) {
      /* copy parameters to be tested and close server before tests */
      const isServer1Listening = server1.expressServer.listening;
      const isServer2Listening = server2.expressServer.listening;
      await server1.stopServer();

      /* test server1 still listening */
      expect(
        isServer1Listening,
        'Should remain a listening server object',
      ).to.eql(true);
      /* test server2 not listening */
      expect(
        isServer2Listening,
        'Should remain a listening server object',
      ).to.eql(false);
      /* test that an error is eventually thrown */
      expect(
        err.message.substring(0, 17),
        'Should be ' + 'a port occupied error',
      ).to.eql('listen EADDRINUSE');
    }
  });

  it('Test listening on an occupied port, but clearing port', async () => {
    const serverType = http;
    const serverOptions = {};
    const serverPort = configServer.PORT;

    /* create the first server occupying the port */
    const server1 = new Server();
    server1.setupServer(serverType, serverOptions, app, serverPort);
    await server1.listenServer(serverPort);

    const listenTries = 3;
    const listenTimeout = 3; // in seconds

    /* create the second server that will request the same port */
    const server2 = new Server();
    server2.setupServer(serverType, serverOptions, app, serverPort);

    /* set the first server to stop listening after test complete */
    setTimeout(async () => {
      await server1.stopServer();
    }, listenTimeout * 1000 + 100);

    try {
      await server2.listenServer(serverPort, listenTries, listenTimeout);

      /* copy parameters to be tested and close second server before tests */
      const isServer1Listening = server1.expressServer.listening;
      const isServer2Listening = server2.expressServer.listening;
      await server2.stopServer();

      expect(
        isServer2Listening,
        'Should leave a listening server object',
      ).to.eql(true);
      expect(
        isServer1Listening,
        'Should return a non-listening server object',
      ).to.eql(false);
    } catch (err) {
      expect.fail('Should not throw an error');
    }
  });

  it('Attempt to listen but unexpected error thrown', async () => {
    const serverType = http;
    const serverOptions = {};
    const serverPort = configServer.PORT;

    const server1 = new Server();
    server1.setupServer(serverType, serverOptions, app, serverPort);

    const listenFake: any = () => {
      const errTest = {
        code: 'Test Error',
      };
      server1.expressServer.emit('error', errTest);
    };

    /* stub server.listen so a test error can be emitted */
    const listenStub = sinon
      .stub(server1.expressServer, 'listen')
      .callsFake(listenFake);

    /* any error other than EADDRINUSE will be immediately thrown */
    const stubError = sinon.stub(console, 'error');
    try {
      await server1.listenServer();
    } catch (err) {
      /* test that an error is eventually thrown */
      expect(err.code, 'Should be test error').to.eql('Test Error');
    }

    expect(server1.expressServer.listening, 'Should equal ' + 'false').to.eql(
      false,
    );

    listenStub.restore();

    /* test that there was no console.log output */
    expect(!stubError.called);
    stubError.restore();
  });

  it('Shuts down a server', async () => {
    const serverType = http;
    const serverOptions = null;
    const serverPort = configServer.PORT;

    const server1 = new Server();
    server1.setupServer(serverType, serverOptions, app, serverPort);
    await server1.listenServer(serverPort);

    await server1.stopServer();
    expect(
      server1.expressServer.listening,
      'Should leave a non-listening server object',
    ).to.eql(false);
  });

  it('Shuts down a non-open server', async () => {
    const serverType = http;
    const serverOptions = null;
    const serverPort = configServer.PORT;

    /* create a listening server */
    const server1 = new Server();
    server1.setupServer(serverType, serverOptions, app, serverPort);
    await server1.listenServer(serverPort);
    /* shut down the listening server */
    await server1.stopServer();

    /* stop the server a second time */
    const result = await server1.stopServer();

    expect(
      server1.expressServer.listening,
      'Should leave a non-listening server object',
    ).to.eql(false);
    expect(result.message, 'Should return an error').to.eql(
      'Server is not running.',
    );
  });
});
