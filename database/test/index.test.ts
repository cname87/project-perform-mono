/* import for types */
import 'mocha';

/* set up sinon & chai */
import chai = require('chai');
import sinon = require('sinon');
import sinonChai = require('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* other external dependencies */
import { Connection } from 'mongoose';

/* internal dependencies */
import { Database } from '../src/database';
import { runDatabaseApp } from '../src/index';

/* common variables */
let database: Database;

before('before', async () => {
  database = await runDatabaseApp();
});

describe('describe', () => {
  it('it', () => {
    expect(database.dbConnection).to.not.eql(undefined);
    database.closeConnection(database.dbConnection as Connection);
  });
});
