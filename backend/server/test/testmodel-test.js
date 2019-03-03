'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('Database model operations', function() {

    const path = require('path');
    const appRoot = require('app-root-path').toString();
    const { config } = require(path.join(appRoot, 'dist', 'server', 'src','configServer'));
    let databaseIndex = config.DATABASE;
    const { createModel } = config.TESTSMODEL;
    const chai = require('chai');
    const expect = chai.expect;
    let dbConnection = {};
    const models = {};
    const docContent1 = {
        test1: 'test11',
        test2: 'test12',
    };
    const docContent2 = {
        test1: 'test21',
        test2: 'test22',
    };

    let database;

    before(async function() {

        /* connection created here is used for all tests */
        database = await databaseIndex.runDatabaseApp();
        dbConnection = database.dbConnection

    });

    after(async function() {

        /* shutdown dbConnection after (if not already shut down) */
        await database.closeConnection(dbConnection);

    });

    it('Creates the model', function() {

        /* create the test model */
        models['Tests'] = createModel(dbConnection, database);

        expect(models['Tests'].collection.name, 'Should return the model')
            .to.eql('tests');

    });

    it('Delete docs', async function() {

        await models['Tests'].deleteMany({
            _id: {
                $exists: true,
            },
        });
        const count = await models['Tests'].countDocuments();
        expect(count, 'All docs have been deleted')
            .to.eql(0);

    });

    it('Create and save docs', async function() {

        const testDoc1 = new models['Tests'](docContent1);
        const returnedDoc1 = await testDoc1.save();
        const testDoc2 = new models['Tests'](docContent2);
        const returnedDoc2 = await testDoc2.save();
        expect(returnedDoc1.test1, 'returned doc to equal doc that was saved')
            .to.eql('test11');
        expect(returnedDoc2.test2, 'returned doc to equal doc that was saved')
            .to.eql('test22');

    });

    it('Find docs', async function() {

        const foundDocs = await models['Tests'].find();
        expect(foundDocs.length, 'to equal')
            .to.eql(2);

    });

    it('Find a doc', async function() {

        const foundDocs = await models['Tests'].find();
        const id = foundDocs[1]._id;
        const foundDoc = await models['Tests'].findById(id);
        expect(foundDoc.test2, 'to equal')
            .to.eql('test22');

    });

    it('Update a doc', async function() {

        const foundDocs = await models['Tests'].find();
        const id = foundDocs[0]._id;
        let foundDoc = await models['Tests'].findById(id);
        await models['Tests'].updateMany({
            _id: {
                $exists: true,
            },
        }, {
            test2: 'updatedTest12',
        });
        foundDoc = await models['Tests'].findById(id);
        expect(foundDoc.test2, 'to equal')
            .to.eql('updatedTest12');

    });

    it('Access a database that is down', async function() {

        /* close dbConnection before db shutdown or mocha won't exit */
        await database.closeConnection(dbConnection);

        try {

            await models['Tests'].find();

        } catch (err) {

            return expect(err, 'Should return an Error')
                .to.be.instanceof(Error);

        }

        expect.fail(true, false, 'Should have failed earlier');

    });

});
