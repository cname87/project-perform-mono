const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

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
import { fail } from 'assert';

/* external dependencies */
import appRootObject = require('app-root-path');
const appRoot = appRootObject.toString();
import { Connection } from 'mongoose';
import path = require('path');
import proxyquire = require('proxyquire');

const indexPath = path.join(appRoot, 'src', 'index');
// const databasePath = path.join(appRoot, 'src', 'database');

/* import .config and database files */
import { getMongoUri } from '../src/.config';
import { Database } from '../src/database';

describe('Database connection', () => {
  /* set up common variables */
  let database: Database;
  let debugStub: any;
  let debugEnabled = true;

  // /* set up a database schema, collection, and model name */
  // const testSchema = {
  //   username: String,
  //   email: String,
  // };
  // const testCollection = 'mochaTest';
  // const testModel = 'mochaTestModel';

  before('Set up database debug.enabled mock', async () => {
    debugStub = (prefix: string) => {
      return (message: string) => {
        debugFunction(prefix).enabled = debugEnabled;
        debugFunction(prefix)(message);
        debug(message);
      };
    };

    /* set up default database */
    const getDatabase = proxyquire(indexPath, {});
    database = await getDatabase.runDatabaseApp();

    // debug(modulename + ':\n\n *** Tests start here ***\n\n');
  });

  afterEach('Close dbConnection & restore database', async () => {
    /* close dbConnection */
    if (
      database &&
      database.dbConnection &&
      database.dbConnection.readyState === 1
    ) {
      await database.closeConnection(database.dbConnection);
    }

    /* restore default database so not needed within each it */
    const getDatabase = proxyquire(indexPath, {});
    database = await getDatabase.runDatabaseApp();
  });

  after('Close dbConnection', async () => {
    /* close dbConnection */
    if (
      database &&
      database.dbConnection &&
      database.dbConnection.readyState === 1
    ) {
      await database.closeConnection(database.dbConnection);
    }
  });

  it('dummy', () => {
    debugStub('TEST_PREFIX')('TEST_MSG)');
    if (database && database.dbConnection) {
      expect(database.dbConnection.readyState).to.eql(1);
    }
  });

  it('Connects to a database', async () => {
    /* get and configure a database */

    /* derive db name from the connection uri */
    const uri = getMongoUri();
    const charStart = uri.indexOf('://');
    const char1 = uri.indexOf('/', charStart + 3); // skip initial :// in uri
    const char2 = uri.indexOf('?ssl=');
    const dbName = uri.substring(char1 + 1, char2);

    if (database && database.dbConnection && database.dbConnection.db) {
      expect(
        database.dbConnection.db.databaseName,
        'Should return a database connection named <dbName>',
      ).to.equal(dbName);
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.equal(1);
    } else {
      expect(fail('database or dbConnection or db is falsy'));
    }
  });

  // it('Connects to an open database', async () => {
  //   /* test not printing database stats */
  //   debugEnabled = false;
  //   database = proxyquire(databasePath, {
  //     debug: debugStub,
  //   }).database;
  //   /* new database instance => configure */
  //   database.configDatabase(config);

  //   dbConnection = await database.connectToDB();
  //   expect(
  //     dbConnection.db.databaseName,
  //     'Should return a database connection',
  //   ).to.equal(config.DB_NAME);
  //   expect(dbConnection.readyState, 'Connection should be open').to.equal(1);
  //   await database.closeConnection(dbConnection);
  // });

  it('Closes an open database connection', async () => {
    if (database && database.dbConnection && database.dbConnection.db) {
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.eql(1);
      await database.closeConnection(database.dbConnection);
      expect(
        database.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);
    } else {
      expect(fail('database or dbConnection or db is falsy'));
    }
  });

  it('Closes a closed database connection', async function() {
    if (database && database.dbConnection && database.dbConnection.db) {
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.eql(1);
      await database.closeConnection(database.dbConnection);
      expect(
        database.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);
      await database.closeConnection(database.dbConnection);
      expect(
        database.dbConnection.readyState,
        'Connection should still be closed',
      ).to.equal(0);
    } else {
      expect(fail('database or dbConnection or db is falsy'));
    }
  });

  it('Closes an invalid database connection', async function() {
    // tslint:disable-next-line: no-object-literal-type-assertion
    const dummy = {} as Connection;
    const result = await database.closeConnection(dummy);
    expect(result, 'Returns an error').to.be.instanceOf(Error);
  });

  // it('Fails to connect to a database', async function() {
  //   /* stub the database server host name function */
  //   const revertDbHost = config.DB_HOST;
  //   config.DB_HOST = 'dummyHost';

  //   database = proxyquire(databasePath, {
  //     [path.join(appRoot, 'dist', '.config')]: config,
  //   }).database;
  //   database.configDatabase(config);

  //   try {
  //     await database.connectToDB();
  //     expect.fail('Should not have reached this point');
  //   } catch (err) {
  //     /* restore database */
  //     config.DB_HOST = revertDbHost;

  //     expect(err.name, 'Should be a MongoNetworkError').to.eql(
  //       'MongoNetworkError',
  //     );
  //   }
  // });

  // it('Creates a mongoose model', async function() {
  //   /* connect to the database and create a db connection */
  //   const dbConnection = await database.connectToDB();
  //   const model = database.createModel(
  //     testModel,
  //     testSchema,
  //     testCollection,
  //     dbConnection,
  //   );
  //   await database.closeConnection(dbConnection);
  //   expect(model.collection.name, 'Should return a mongoose model').to.eql(
  //     testCollection,
  //   );
  // });

  // it('Fails to create a mongoose model', async function() {
  //   try {
  //     database.createModel(
  //       testModel,
  //       testSchema,
  //       testCollection,
  //       'dummyConnection',
  //     );
  //     expect.fail('Should not have reached this point');
  //   } catch (err) {
  //     expect(err.name, 'Should be a connection error').to.eql('TypeError');
  //   }
  // });
});
