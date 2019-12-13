import { setupDebug } from '../../utils/src/debugOutput';
setupDebug(__filename);

import { configServer as configOriginal } from '../../configServer';
import { Logger } from '../../utils/src/logger';
import { DumpError } from '../../utils/src/dumpError';

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

import winston from 'winston';

describe('Start server tests', () => {
  /* create a copy of config that you can edit */
  const config: any = {};
  let key = '';
  for (key in configOriginal) {
    if (configOriginal.hasOwnProperty(key)) {
      config[key] = configOriginal[key];
    }
  }

  /* internal dumpError and logger utilities */
  const logger = new Logger() as winston.Logger;
  const dumpError = new DumpError(logger);

  let app: any;
  let objects: any = {};
  let startServer: any;

  before('Set up objects', () => {
    startServer = require('../startserver').startServer;
    /* set up the objects object */
    app = require('express')();
    objects = app.locals = {
      servers: [], // holds created http servers
      config,
      logger,
      dumpError,
    };
  });

  afterEach('Stop servers', async () => {
    /* shutdown the servers after */
    for (const svr of objects['servers']) {
      await svr.stopServer();
      svr.expressServer.removeAllListeners();
    }

    objects['servers'] = [];
  });

  it('Start http server only', async () => {
    try {
      await startServer(
        app,
        objects.servers,
        objects.config,
        objects.logger,
        objects.dumpError,
      );
    } catch (err) {
      expect.fail('Should not throw an error');
    }

    expect(
      objects.servers[0].expressServer.listening,
      'Should return ' + 'a listening server object',
    ).to.eql(true);

    expect(objects.servers[1], 'Should be undefined').to.eql(undefined);
  });

  it('Throws an error on failed listening request', async () => {
    try {
      /* start server twice and second listen attempt will fail */
      await startServer(
        app,
        objects.servers,
        objects.config,
        objects.logger,
        objects.dumpError,
      );
      await startServer(
        app,
        objects.servers,
        objects.config,
        objects.logger,
        objects.dumpError,
      );
      expect.fail('Should not have reached here');
    } catch (err) {
      expect(err.code, 'Should throw a port busy error').to.eql('EADDRINUSE');
    }
  });
});
