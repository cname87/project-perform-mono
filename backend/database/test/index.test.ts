const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* set up mocha, sinon & chai */
import chai = require('chai');
import 'mocha';
import sinon = require('sinon');
import sinonChai = require('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* internal dependencies */
import { runDatabaseApp } from '../src/index';

describe('index database connection', () => {
  debug(`Running ${modulename} describe - index database connection`);

  it('has readystate = 1', async () => {
    debug(`Running ${modulename} it - has readystate = 1`);

    /* create database connection */
    const database = await runDatabaseApp();

    /* test for an open database connection */
    database.dbConnection
      ? expect(database.dbConnection.readyState).to.eql(1)
      : expect.fail(true, false, 'no dbConnection object');

    /* close database connection */
    database.closeConnection(database.dbConnection);
  });
});
