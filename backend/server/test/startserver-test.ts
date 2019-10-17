import { join, sep } from 'path';
const modulename = __filename.slice(__filename.lastIndexOf(sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('Start server tests', () => {
  const appRoot = require('app-root-path').toString();

  const { config: configOriginal } = require(join(
    appRoot,
    'backend',
    'dist',
    'server',
    'src',
    'configServer',
  ));
  /* create a copy of config that you can edit */
  const config: any = {};
  let key = '';
  for (key in configOriginal) {
    if (configOriginal.hasOwnProperty(key)) {
      config[key] = configOriginal[key];
    }
  }

  /* internal dumpError and logger utilities */
  const Logger = config.Logger;
  const logger = new Logger();
  const DumpError = config.DumpError;
  const dumpError = new DumpError(logger);

  const chai = require('chai');
  const sinon = require('sinon');
  const sinonChai = require('sinon-chai');

  chai.use(sinonChai);
  const expect = chai.expect;
  sinon.assert.expose(chai.assert, {
    prefix: '',
  });

  let app: any = {};
  let objects: any = {};

  before('Set up objects', () => {
    /* set up the objects object */
    app = require('express')();
    objects = app.locals = {
      servers: [], // created http(s) servers
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
    /* turn https off */
    config.HTTPS_ON = false;

    try {
      await config.startServer(
        app,
        objects.servers,
        objects.config,
        objects.logger,
        objects.dumpError,
      );
    } catch (err) {
      expect.fail(err, null, 'Should not throw an error');
    }
    /* test http server */
    expect(
      objects.servers[0].expressServer.listening,
      'Should return ' + 'a listening server object',
    ).to.eql(true);
    /* test https server */
    expect(objects.servers[1], 'Should be undefined').to.eql(undefined);
  });

  it('Start http and https server', async () => {
    /* turn https on */
    config.HTTPS_ON = true;

    try {
      await config.startServer(
        app,
        objects.servers,
        objects.config,
        objects.logger,
        objects.dumpError,
      );
    } catch (err) {
      expect.fail(err, null, 'Should not throw an error');
    }
    /* test http server */
    expect(
      objects.servers[0].expressServer.listening,
      'Should return ' + 'a listening server object',
    ).to.eql(true);
    /* test https server */
    expect(
      objects.servers[1].expressServer.listening,
      'Should return ' + 'a listening server object',
    ).to.eql(true);
  });

  it('Throws an error on failed listening request', async () => {
    try {
      /* start server twice and second listen attempt will fail */
      await config.startServer(
        app,
        objects.servers,
        objects.config,
        objects.logger,
        objects.dumpError,
      );
      await config.startServer(
        app,
        objects.servers,
        objects.config,
        objects.logger,
        objects.dumpError,
      );
      expect.fail(true, false, 'should not have reached here');
    } catch (err) {
      expect(err.code, 'Should throw a port busy error').to.eql('EADDRINUSE');
    }
  });
});
