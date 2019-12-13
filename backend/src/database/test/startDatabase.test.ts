/**
 * NOTE: Relies on the backend database server being up and running.
 */

import { setupDebug } from '../../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

import { configDatabase } from '../configDatabase';

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

/* use proxyquire for startDatabase.js module loading */
import proxyquire from 'proxyquire';

const { startDatabasePath } = configDatabase;

/* tests */
describe('startDatabase', () => {
  debug(`Running ${modulename} describe - startDatabase`);

  let originalDbSetting: string | undefined;
  before('save database setting', () => {
    originalDbSetting = process.env.DB_IS_LOCAL;
  });

  after('reset database setting', () => {
    process.env.DB_IS_LOCAL = originalDbSetting;
  });

  const tests =
    process.env.TEST_DB_LOCAL === 'true'
      ? [{ db_is_local: 'false' }, { db_is_local: 'true' }]
      : [{ db_is_local: 'false' }];

  tests.forEach((test) => {
    it('connects to a database', async () => {
      debug(`Running ${modulename} it - connects to a database`);

      /* configure for a remote and then local database */
      process.env.DB_IS_LOCAL = test.db_is_local;

      const message =
        process.env.DB_IS_LOCAL === 'true'
          ? '*** The local database server MUST be started ***'
          : '*** The remote database server MUST be reachable ***';

      console.warn(message);

      debug('running startDatabase.js');
      const index = proxyquire(startDatabasePath, {});

      let database;
      try {
        debug('creating database connection');
        database = await index.startDatabase();
      } catch (err) {
        debug('error thrown - database server may not be reachable?');
        expect.fail(
          'Error throw - did you forget to start the database server?',
        );
      }

      debug('test for an open database connection');
      database.dbConnection
        ? expect(database.dbConnection.readyState).to.eql(
            Perform.DbReadyState.Connected,
          )
        : expect.fail('no dbConnection object returned');

      debug('close database connection');
      await database.closeConnection(database.dbConnection);
    });

    it('fails to connect to a database', async () => {
      debug(`Running ${modulename} it - fails to connect to a database`);

      debug('running startDatabase.js with stub');
      const index = proxyquire(startDatabasePath, {});

      let errorThrown = false;
      try {
        debug('starting database but error expected');
        await index.startDatabase({});
      } catch (err) {
        errorThrown = true;
        expect(err instanceof Error).to.be.true;
      } finally {
        expect(errorThrown).to.eql(true);
      }
    });
  });
});
