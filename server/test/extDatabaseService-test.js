'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

/* test root file should have started the database already */
/* this file should leave the database open */

describe('mongoDB startup/shutdown', function() {
  const path = require('path');
  const appRoot = require('app-root-path').toString();
  const { config } = require(path.join(appRoot, 'dist', '.config'));
  let extDatabaseService = config.START_DB_SERVICE;
  const extDatabaseServicePath = '../dist/database/extDatabaseService';
  const chai = require('chai');
  const sinon = require('sinon');
  const proxyquire = require('proxyquire');

  const expect = chai.expect;

  /* uncomment before & after to suppress console.log
   * test for Windows stop service failure */
  let stubLog = {};
  before('Spy console.log', async function() {
    stubLog = sinon.spy(console, 'log');
  });

  after('Test console.log for error', async function() {
    expect(stubLog.calledWithMatch('The pipe has been ended')).to.be.false;
    stubLog.restore();
  });

  it('Starts a database that is already open', async function() {
    const output = await extDatabaseService.startDB(config);
    expect(output, 'Should return 0').to.eql(0);
  });

  it('Shuts down a database that is open', async function() {
    const output = await extDatabaseService.shutdownDB(config);
    expect(output, 'Should return 1').to.eql(1);
  });

  it('Shuts down a database that is not open', async function() {
    const output = await extDatabaseService.shutdownDB(config);
    expect(output, 'Should return 0').to.eql(0);
  });

  /* test an error running the start service */
  it('Fails to start up a database', async function() {
    /* stub sc.query behaviour */
    function scQueryDebug() {
      throw new Error();
    }

    extDatabaseService = proxyquire(extDatabaseServicePath, {
      'windows-service-controller': {
        query: scQueryDebug,
      },
    });

    const err = await extDatabaseService.startDB(config);

    expect(err.message, 'Should fail to start').to.eql(
      'mongod start up failure',
    );

    /* restore functionality */
    extDatabaseService = require(extDatabaseServicePath);
  });

  /* test an error running the stop service */
  it('Fails to stop a database', async function() {
    /* stub sc.query behaviour */
    function scQueryDebug() {
      throw new Error();
    }

    extDatabaseService = proxyquire(extDatabaseServicePath, {
      'windows-service-controller': {
        query: scQueryDebug,
      },
    });

    const err = await extDatabaseService.shutdownDB(config);

    expect(err.message, 'Should fail to shutdown').to.eql(
      'mongod shutdown failure',
    );

    /* restore functionality */
    extDatabaseService = proxyquire(extDatabaseServicePath, {});
  });

  it('Starts up a database that is not open', async function() {
    const output = await extDatabaseService.startDB(config);
    expect(output, 'Should return 1').to.eql(1);
  });
});
