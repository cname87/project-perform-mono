const modulename: string = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction = require('debug');
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* set up mocha, sinon & chai */
import { fail } from 'assert';
import chai = require('chai');
import 'mocha';
import sinon = require('sinon');
import sinonChai = require('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* external dependencies */
import appRootObject = require('app-root-path');
const appRoot = appRootObject.toString();
import { SchemaDefinition } from 'mongoose';
import path = require('path');
import proxyquireObject = require('proxyquire');
const proxyquire = proxyquireObject.noPreserveCache();

const indexPath = path.join(appRoot, 'dist', 'database', 'src', 'index');

/* internal dependencies */
// import 'dotenv/config';
import {
  Database,
  filepaths,
  getConnectionOptions,
  getMongoUri,
} from '../src/configDatabase';
// tslint:disable-next-line: ordered-imports
import * as dotenv from 'dotenv';
dotenv.config({ path: filepaths.ENV_FILE });

describe('Database connection', () => {
  debug(`Running ${modulename} describe - Database.connection`);

  /* set up module  variables */
  let database: Database;
  const debugEnabled = true;
  const spyDebug = sinon.spy();

  /* derive db name from the connection uri */
  const uri = getMongoUri();
  const charStart = uri.indexOf('://');
  const char1 = uri.indexOf('/', charStart + 3); // skip initial :// in uri
  const char2 = uri.indexOf('?ssl=');
  const dbName = uri.substring(char1 + 1, char2);

  /* set up a database schema, collection, and model name */
  const testSchema: SchemaDefinition = {
    username: String,
    email: String,
  };
  const testCollection = 'mochaTest';
  const testModel = 'mochaTestModel';

  afterEach('Close database connection', async () => {
    debug(`Running ${modulename} afterEach - Close database connection`);

    /* close dbConnection if open */
    if (
      database &&
      database.dbConnection &&
      database.dbConnection.readyState === 1
    ) {
      await database.closeConnection(database.dbConnection);
    }
  });

  it('tests spyDebug', async () => {
    debug(`Running ${modulename} it - tests spyDebug`);

    /* stub index import debugFunction function */
    const debugFunctionStub = (prefix: string) => {
      const debugLocal = debugFunction(prefix);
      debugLocal.enabled = debugEnabled;
      return (message: string) => {
        spyDebug(message);
        debugLocal(message);
      };
    };

    /* try connect to database */
    const getDatabase = proxyquire(indexPath, {
      debug: debugFunctionStub,
    });
    database = await getDatabase.runDatabaseApp();

    if (true) {
      /* slice off /index.js: as it might be index.ts depending on run mechanism */
      expect(spyDebug.lastCall.lastArg.slice(-22)).to.eql(
        'running runDatabaseApp',
      );
    }
  });

  it('makes a connection to a database', async () => {
    debug(`Running ${modulename} it - makes a connection to a database`);

    /* close dbConnection if open */
    if (
      database &&
      database.dbConnection &&
      database.dbConnection.readyState === 1
    ) {
      await database.closeConnection(database.dbConnection);
      expect(
        database.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);
    }

    /* connect to database */
    const getDatabase = proxyquire(indexPath, {});
    database = await getDatabase.runDatabaseApp();

    /* test */
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

  it('makes a 2nd connection to a database', async () => {
    debug(`Running ${modulename} it - makes a 2nd connection to a database`);

    /* connect to database */
    const getDatabase = proxyquire(indexPath, {});
    database = await getDatabase.runDatabaseApp();

    /* test */
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

    /* make a 2nd connection to the database */
    const database2 = await getDatabase.runDatabaseApp();

    /* test */
    if (database2 && database2.dbConnection && database2.dbConnection.db) {
      expect(
        database2.dbConnection.db.databaseName,
        'Should return a database connection named <dbName>',
      ).to.equal(dbName);
      expect(
        database2.dbConnection.readyState,
        'Connection should be open',
      ).to.equal(1);

      /* close 2nd dbConnection */
      await database2.closeConnection(database2.dbConnection);
      expect(
        database2.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);
    } else {
      expect(fail('database or dbConnection or db is falsy'));
    }
  });

  it('fails to connect to a database', async () => {
    debug(`Running ${modulename} it - fails to connect to a database`);

    /* stub the database getMongoUri function */
    const configStub = {
      getMongoUri: () => 'dummyUri',
    };

    /* try connect to database */
    const getDatabase = proxyquire(indexPath, {
      './configDatabase': configStub,
    });

    try {
      await getDatabase.runDatabaseApp();
      expect.fail('Should not have reached this point');
    } catch (err) {
      expect(err.name, 'Should be a MongoParseError').to.eql('MongoParseError');
    }
  });

  it('closes an open database connection', async () => {
    debug(`Running ${modulename} it - closes an open database connection`);

    /* connect to database */
    const getDatabase = proxyquire(indexPath, {});
    database = await getDatabase.runDatabaseApp();

    if (database && database.dbConnection && database.dbConnection.db) {
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.eql(1);

      /* close to database */
      await database.closeConnection(database.dbConnection);

      /* test */
      expect(
        database.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);
    } else {
      expect(fail('database or dbConnection or db is falsy'));
    }
  });

  it('closes a closed database connection', async () => {
    debug(`Running ${modulename} it - closes a closed database connection`);

    if (database && database.dbConnection && database.dbConnection.db) {
      /* close database */
      await database.closeConnection(database.dbConnection);
      expect(
        database.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);

      /* close again */
      await database.closeConnection(database.dbConnection);

      /* test */
      expect(
        database.dbConnection.readyState,
        'Connection should still be closed',
      ).to.equal(0);
    } else {
      expect(fail('database or dbConnection or db is falsy'));
    }
  });

  it('closes an invalid database connection', async () => {
    debug(`Running ${modulename} it - closes an invalid database connection`);

    const dummyConnection: any = {};
    const result = await database.closeConnection(dummyConnection);
    expect(result, 'Returns an error').to.be.instanceOf(Error);
  });

  it('Creates a mongoose model', async () => {
    debug(`Running ${modulename} it creates a mongoose model`);

    /* connect to database */
    const getDatabase = proxyquire(indexPath, {});
    database = await getDatabase.runDatabaseApp();

    const model = database.createModel(testModel, testSchema, testCollection);
    expect(model.collection.name, 'Should return a mongoose model').to.eql(
      testCollection,
    );
  });

  it('Fails to create a mongoose model', async () => {
    debug(`Running ${modulename} it - fails to create a mongoose model`);

    /* connect to database */
    const getDatabase = proxyquire(indexPath, {});
    database = await getDatabase.runDatabaseApp();

    const dummyCollection: any = {}; // will fail

    try {
      database.createModel(testModel, testSchema, dummyCollection);
      expect.fail('Should not have reached this point');
    } catch (err) {
      expect(err.message, 'Should be a connection error').to.eql(
        'collection name must be a String',
      );
    }
  });

  it('tests sending no logger or dumpError', async () => {
    debug(`Running ${modulename} it - tests sending no logger or dumpError`);

    /* connect to database without configuring logger or dumpError */
    const connectionUrl = getMongoUri();
    const connectOptions = getConnectionOptions();
    database = new filepaths.DATABASE.Database(connectionUrl, connectOptions);
    database.dbConnection = await database.dbConnectionPromise;

    /* test */
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
});
