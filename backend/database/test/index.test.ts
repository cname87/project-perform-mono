const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/*
 * external dependencies
 */

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

/* other external dependencies */
/* use proxyquire for index.js module loading */
import proxyquireObject = require('proxyquire');
/* ensure fresh load each time */
const proxyquire = proxyquireObject.noPreserveCache();

/*
 * internal dependencies
 */
import {
  DBReadyState, // type for database connected readystate
  indexPath, // path to database index.js file
} from '../src/configDatabase';

/*
 * tests
 */
describe('index database connection', () => {
  debug(`Running ${modulename} describe - index database connection`);

  it('has readystate = Connected', async () => {
    debug(`Running ${modulename} it - has readystate = Connected`);

    debug('running database index.js');
    const index = proxyquire(indexPath, {});

    debug('creating database connection');
    const database = await index.runDatabaseApp();

    debug('test for an open database connection');
    database.dbConnection
      ? expect(database.dbConnection.readyState).to.eql(DBReadyState.Connected)
      : expect.fail(true, false, 'no dbConnection object');

    debug('close database connection');
    database.closeConnection(database.dbConnection);
  });
});
