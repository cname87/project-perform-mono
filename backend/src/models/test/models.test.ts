import { setupDebug } from '../../utils/src/debugOutput';

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';

/* external dependencies */
import { Document, Model } from 'mongoose';

/* internal dependencies */
import { startDatabase } from '../../database/src/startDatabase';
import { createModelTests } from './tests';

const { modulename, debug } = setupDebug(__filename);
const { expect } = chai;

/* tests */
describe('Database models operations', () => {
  debug(`Running ${modulename} describe - Database models operation`);

  let database: Perform.Database;
  interface ITestModel {
    id: number;
    name: string;
  }
  let docContent1: ITestModel;
  let docContent2: ITestModel;
  let modelTests: Model<Document>;

  before('Create database connection', async () => {
    debug(`Running ${modulename} before - Create database connection`);

    database = await startDatabase();

    docContent1 = {
      id: 11,
      name: 'test12',
    };
    docContent2 = {
      id: 21,
      name: 'test22',
    };
  });

  after('Close database connection', async () => {
    debug(`Running ${modulename} after - Close database connection`);
    await database.closeConnection(database.dbConnection);
    // wtf.dump(); // debug mocha not exiting - shows mocha timers active after last error test
  });

  it('creates the tests model', async () => {
    debug(`Running ${modulename} it - creates the test model`);

    debug(`${modulename}: create tests model`);
    modelTests = createModelTests(database);
    expect(modelTests.collection.name, 'Should return the model').to.eql(
      'tests',
    );
  });

  it('deletes docs', async () => {
    debug(`Running ${modulename} it - deletes docs`);

    debug(`${modulename}: delete tests docs`);
    await modelTests.deleteMany({
      _id: {
        $exists: true,
      },
    });
    const count = await modelTests.countDocuments();

    expect(count, 'All docs have been deleted').to.eql(0);
  });

  it('creates and saves docs', async () => {
    debug(`Running ${modulename} it - creates and saves docs`);

    debug(`${modulename}: create and save docs`);
    const testDoc1 = new modelTests(docContent1);
    const returnedDoc1 = await testDoc1.save();
    const testDoc2 = new modelTests(docContent2);
    const returnedDoc2 = await testDoc2.save();

    expect(
      returnedDoc1.get('id'),
      'returned doc to equal doc that was saved',
    ).to.eql(11);
    expect(
      returnedDoc2.get('name'),
      'returned doc to equal doc that was saved',
    ).to.eql('test22');
  });

  it('finds docs', async () => {
    debug(`Running ${modulename} it - finds docs`);

    debug(`${modulename}: find docs`);
    const foundDocs = await modelTests.find();

    expect(foundDocs.length, 'to equal').to.eql(2);
  });

  it('finds a doc', async () => {
    debug(`Running ${modulename} it - finds a doc`);

    debug(`${modulename}: find a doc`);
    const foundDoc = await modelTests.findOne({ id: 21 });

    foundDoc
      ? expect(foundDoc.get('name'), 'to equal').to.eql('test22')
      : expect.fail('Should have failed earlier');
  });

  it('updates a doc', async () => {
    debug(`Running ${modulename} it - updates a doc`);

    debug(`${modulename}: update a doc`);
    let foundDoc = await modelTests.findOne({ id: 11 });
    await modelTests.updateMany(
      {
        _id: {
          $exists: true,
        },
      },
      {
        name: 'updatedTest12',
      },
    );
    foundDoc = await modelTests.findOne({ id: 11 });

    foundDoc
      ? expect(foundDoc.get('name'), 'to equal').to.eql('updatedTest12')
      : expect.fail('Should have failed earlier');
  });

  it('fails to access a database that is down', async () => {
    debug(`Running ${modulename} it - fails to access a database that is down`);

    debug(`${modulename}: close database`);
    /* note pass force = true to clean up after error or mocha won't close */
    await database.closeConnection(database.dbConnection, true);

    try {
      await modelTests.find();
      expect.fail('Should have failed earlier');
    } catch (err) {
      expect(err.name, 'Should return an Error').to.eql('MongooseError');
    }
  });
});
