const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/*
 * external dependencies
 */

/* set up mocha, sinon & chai */
import chai = require('chai');
import 'mocha';
const expect = chai.expect;

/* external dependencies */
import { Document, Model } from 'mongoose';

/*
 * internal dependencies
 */

import { runDatabaseApp } from '../../database/src/index';
import { Database } from '../src/configModels';
import { createModelTests } from '../src/tests';
import { createModelUsers } from '../src/users';

/*
 * tests
 */
describe('Database models operations', () => {
  debug(`Running ${modulename} describe - Database models operation`);

  let database: Database;
  interface ITestModel {
    test1: string;
    test2: string;
  }
  let docContent1: ITestModel;
  let docContent2: ITestModel;
  let modelTests: Model<Document>;

  before('Create database connection & tests model', async () => {
    debug(
      `Running ${modulename} after - Create database connection & tests model`,
    );

    database = await runDatabaseApp();

    docContent1 = {
      test1: 'test11',
      test2: 'test12',
    };
    docContent2 = {
      test1: 'test21',
      test2: 'test22',
    };
  });

  after('Close database connection', async () => {
    debug(`Running ${modulename} after - Close database connection`);

    await database.closeConnection(database.dbConnection);
  });

  it('creates the tests model', async () => {
    debug(`Running ${modulename} it - creates the test model`);

    debug('create tests model');
    modelTests = createModelTests(database);
    debug('run tests');
    expect(modelTests.collection.name, 'Should return the model').to.eql(
      'tests',
    );
  });

  it('Creates the users model', async () => {
    debug(`Running ${modulename} it - creates the test model`);

    debug('create users model');
    const modelUsers = createModelUsers(database);

    debug('run tests');
    expect(modelUsers.collection.name, 'Should return the model').to.eql(
      'users',
    );
  });

  it('deletes docs', async () => {
    debug(`Running ${modulename} it - deletes docs`);

    debug('delete tests docs');
    await modelTests.deleteMany({
      _id: {
        $exists: true,
      },
    });
    const count = await modelTests.countDocuments();

    debug('run tests');
    expect(count, 'All docs have been deleted').to.eql(0);
  });

  it('creates and saves docs', async () => {
    debug(`Running ${modulename} it - creates and saves docs`);

    debug('create docs');
    const testDoc1 = new modelTests(docContent1);
    const returnedDoc1 = await testDoc1.save();
    const testDoc2 = new modelTests(docContent2);
    const returnedDoc2 = await testDoc2.save();

    debug('run tests');
    expect(
      returnedDoc1.get('test1'),
      'returned doc to equal doc that was saved',
    ).to.eql('test11');
    expect(
      returnedDoc2.get('test2'),
      'returned doc to equal doc that was saved',
    ).to.eql('test22');
  });

  it('finds docs', async () => {
    debug(`Running ${modulename} it - finds docs`);

    debug('find docs');
    const foundDocs = await modelTests.find();

    debug('run tests');
    expect(foundDocs.length, 'to equal').to.eql(2);
  });

  it('finds a doc', async () => {
    debug(`Running ${modulename} it - finds a doc`);

    debug('find a doc');
    const foundDocs = await modelTests.find();
    const id = foundDocs[1]._id;
    const foundDoc = await modelTests.findById(id);

    debug('run tests');
    foundDoc
      ? expect(foundDoc.get('test2'), 'to equal').to.eql('test22')
      : expect.fail(true, false, 'Should have failed earlier');
  });

  it('updates a doc', async () => {
    debug(`Running ${modulename} it - updates a doc`);

    debug('update a doc');
    const foundDocs = await modelTests.find();
    const id = foundDocs[0]._id;
    let foundDoc = await modelTests.findById(id);
    await modelTests.updateMany(
      {
        _id: {
          $exists: true,
        },
      },
      {
        test2: 'updatedTest12',
      },
    );
    foundDoc = await modelTests.findById(id);

    debug('run tests');
    foundDoc
      ? expect(foundDoc.get('test2'), 'to equal').to.eql('updatedTest12')
      : expect.fail(true, false, 'Should have failed earlier');
  });

  it('fails to access a database that is down', async () => {
    debug(`Running ${modulename} it - fails to access a database that is down`);

    debug('close database');
    await database.closeConnection(database.dbConnection);

    debug('run tests');
    try {
      await modelTests.find();
      expect.fail(true, false, 'Should have failed earlier');
    } catch (err) {
      expect(err, 'Should return an Error').to.be.instanceof(Error);
    }
  });
});
