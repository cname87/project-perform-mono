const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* set up mocha, sinon & chai */
import chai = require('chai');
import 'mocha';
const expect = chai.expect;

/* external dependencies */
import appRootObject = require('app-root-path');
const appRoot = appRootObject.toString();
import { Document, Model } from 'mongoose';
import path = require('path');
import proxyquire = require('proxyquire');

/* database type */
import { Database, test } from '../src/configModels';
console.log(test);

describe('Database models operations', () => {
  let database: Database;
  interface ITestModel {
    test1: string;
    test2: string;
  }
  let docContent1: ITestModel;
  let docContent2: ITestModel;
  let modelTests: Model<Document>;

  before(async () => {
    /* connection created here is used for all tests */
    const databaseIndexPath = path.join(appRoot, 'database', 'src', 'index');
    const { runDatabaseApp } = proxyquire(databaseIndexPath, {});
    database = await runDatabaseApp();

    const testsModelsPath = path.join(appRoot, 'models', 'src', 'tests');

    /* use proxyquire to allow istanbul coverage work */
    const { createModel } = proxyquire(testsModelsPath, {});

    docContent1 = {
      test1: 'test11',
      test2: 'test12',
    };
    docContent2 = {
      test1: 'test21',
      test2: 'test22',
    };

    modelTests = createModel(database.dbConnection, database);
  });

  after(async () => {
    /* shutdown dbConnection after (if not already shut down) */
    await database.closeConnection(database.dbConnection);
  });

  it('Creates the tests model', async () => {
    expect(modelTests.collection.name, 'Should return the model').to.eql(
      'tests',
    );
  });

  it('Creates the users model', async () => {
    const usersModelsPath = path.join(appRoot, 'models', 'src', 'users');
    const { createModel } = proxyquire(usersModelsPath, {});
    const modelUsers = createModel(database.dbConnection, database);
    expect(modelUsers.collection.name, 'Should return the model').to.eql(
      'users',
    );
  });

  it('Deletes docs', async () => {
    await modelTests.deleteMany({
      _id: {
        $exists: true,
      },
    });
    const count = await modelTests.countDocuments();
    expect(count, 'All docs have been deleted').to.eql(0);
  });

  it('Create and save docs', async () => {
    const testDoc1 = new modelTests(docContent1);
    const returnedDoc1 = await testDoc1.save();
    const testDoc2 = new modelTests(docContent2);
    const returnedDoc2 = await testDoc2.save();
    expect(
      returnedDoc1.get('test1'),
      'returned doc to equal doc that was saved',
    ).to.eql('test11');
    expect(
      returnedDoc2.get('test2'),
      'returned doc to equal doc that was saved',
    ).to.eql('test22');
  });

  it('Find docs', async () => {
    const foundDocs = await modelTests.find();
    expect(foundDocs.length, 'to equal').to.eql(2);
  });

  it('Find a doc', async () => {
    const foundDocs = await modelTests.find();
    const id = foundDocs[1]._id;
    const foundDoc = await modelTests.findById(id);
    foundDoc
      ? expect(foundDoc.get('test2'), 'to equal').to.eql('test22')
      : expect.fail(true, false, 'Should have failed earlier');
  });

  it('Update a doc', async () => {
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
    foundDoc
      ? expect(foundDoc.get('test2'), 'to equal').to.eql('updatedTest12')
      : expect.fail(true, false, 'Should have failed earlier');
  });

  it('Access a database that is down', async () => {
    /* close dbConnection before db shutdown or mocha won't exit */
    await database.closeConnection(database.dbConnection);

    try {
      await modelTests.find();
      expect.fail(true, false, 'Should have failed earlier');
    } catch (err) {
      expect(err, 'Should return an Error').to.be.instanceof(Error);
    }
  });
});
