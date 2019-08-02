"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debugFunction = require("debug");
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/*
 * external dependencies
 */
/* set up mocha, sinon & chai */
const assert_1 = require("assert");
const chai = require("chai");
require("mocha");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
    prefix: '',
});
const proxyquireObject = require("proxyquire");
const proxyquire = proxyquireObject.noPreserveCache();
/*
 * internal dependencies
 */
const configDatabase_1 = require("../src/configDatabase");
/**
 * tests
 */
describe('Database connection', () => {
    debug(`Running ${modulename} describe - Database.connection`);
    /* set up module  variables */
    let database;
    const spyDebug = sinon.spy();
    /* derive db name from the connection uri */
    const uri = configDatabase_1.getMongoUri();
    const charStart = uri.indexOf('://');
    const char1 = uri.indexOf('/', charStart + 3); // skip initial :// in uri
    const char2 = uri.indexOf('?ssl=');
    const dbName = uri.substring(char1 + 1, char2);
    /* set up a database schema, collection, and model name */
    const testSchema = {
        username: String,
        email: String,
    };
    const testCollection = 'mochaTest';
    const testModel = 'mochaTestModel';
    afterEach('close database connection', async () => {
        debug(`Running ${modulename} afterEach - close database connection`);
        debug('close dbConnection if open');
        if (database &&
            database.dbConnection &&
            database.dbConnection.readyState === 1 /* Connected */) {
            await database.closeConnection(database.dbConnection);
        }
    });
    it('tests spyDebug', async () => {
        debug(`Running ${modulename} it - tests spyDebug`);
        debug('spy on index debug function via debugFunction stub');
        const debugFunctionStub = (prefix) => {
            const debugIndex = debugFunction(prefix);
            debugIndex.enabled = true;
            return (message) => {
                spyDebug(message);
                debugIndex(message);
            };
        };
        debug('connect to database');
        const getDatabase = proxyquire(configDatabase_1.indexPath, {
            debug: debugFunctionStub,
        });
        database = await getDatabase.runDatabaseApp();
        debug('run tests');
        /* slice off /index.js: as it might be /index.ts */
        expect(spyDebug.lastCall.lastArg.slice(-22)).to.eql('running runDatabaseApp');
    });
    it('makes a connection to a database', async () => {
        debug(`Running ${modulename} it - makes a connection to a database`);
        debug('connect to database');
        const getDatabase = proxyquire(configDatabase_1.indexPath, {});
        database = await getDatabase.runDatabaseApp();
        debug('run tests');
        if (database && database.dbConnection && database.dbConnection.db) {
            expect(database.dbConnection.db.databaseName, 'Should return a database connection named <dbName>').to.equal(dbName);
            expect(database.dbConnection.readyState, 'Connection should be open').to.equal(1 /* Connected */);
        }
        else {
            expect(assert_1.fail('database or dbConnection or db is falsy'));
        }
    });
    it('makes a 2nd connection to a database', async () => {
        debug(`Running ${modulename} it - makes a 2nd connection to a database`);
        debug('connect to database');
        const getDatabase = proxyquire(configDatabase_1.indexPath, {});
        database = await getDatabase.runDatabaseApp();
        debug('run tests');
        if (database && database.dbConnection && database.dbConnection.db) {
            expect(database.dbConnection.db.databaseName, 'Should return a database connection named <dbName>').to.equal(dbName);
            expect(database.dbConnection.readyState, 'Connection should be open').to.equal(1 /* Connected */);
        }
        else {
            expect(assert_1.fail('database or dbConnection or db is falsy'));
        }
        debug('make a 2nd connection to the database');
        const database2 = await getDatabase.runDatabaseApp();
        debug('run tests');
        if (database2 && database2.dbConnection && database2.dbConnection.db) {
            expect(database2.dbConnection.db.databaseName, 'Should return a database connection named <dbName>').to.equal(dbName);
            expect(database2.dbConnection.readyState, 'Connection should be open').to.equal(1 /* Connected */);
            debug('close the 2nd dbConnection');
            await database2.closeConnection(database2.dbConnection);
            debug('run tests');
            expect(database2.dbConnection.readyState, 'Connection should be closed').to.equal(0);
        }
        else {
            expect(assert_1.fail('database or dbConnection or db is falsy'));
        }
    });
    it('fails to connect to a database', async () => {
        debug(`Running ${modulename} it - fails to connect to a database`);
        /* stub the database getMongoUri function */
        const configStub = {
            getMongoUri: () => 'dummyUri',
        };
        debug('failed connection to database');
        const getDatabase = proxyquire(configDatabase_1.indexPath, {
            './configDatabase': configStub,
        });
        try {
            await getDatabase.runDatabaseApp();
            expect.fail('Should not have reached this point');
        }
        catch (err) {
            expect(err.name, 'Should be a MongoParseError').to.eql('MongoParseError');
        }
    });
    it('closes an open database connection', async () => {
        debug(`Running ${modulename} it - closes an open database connection`);
        debug('connect to database');
        const getDatabase = proxyquire(configDatabase_1.indexPath, {});
        database = await getDatabase.runDatabaseApp();
        if (database && database.dbConnection && database.dbConnection.db) {
            debug('run tests');
            expect(database.dbConnection.readyState, 'Connection should be open').to.eql(1 /* Connected */);
            debug('close the database');
            await database.closeConnection(database.dbConnection);
            debug('run tests');
            expect(database.dbConnection.readyState, 'Connection should be closed').to.equal(0);
        }
        else {
            expect(assert_1.fail('database or dbConnection or db is falsy'));
        }
    });
    it('closes a closed database connection', async () => {
        debug(`Running ${modulename} it - closes a closed database connection`);
        if (database && database.dbConnection && database.dbConnection.db) {
            debug('close the database');
            await database.closeConnection(database.dbConnection);
            expect(database.dbConnection.readyState, 'Connection should be closed').to.equal(0);
            debug('close the database again');
            await database.closeConnection(database.dbConnection);
            debug('run tests');
            expect(database.dbConnection.readyState, 'Connection should still be closed').to.equal(0);
        }
        else {
            expect(assert_1.fail('database or dbConnection or db is falsy'));
        }
    });
    it('closes an invalid database connection', async () => {
        debug(`Running ${modulename} it - closes an invalid database connection`);
        debug('try close an invalid database');
        const dummyConnection = {};
        const result = await database.closeConnection(dummyConnection);
        debug('run tests');
        expect(result, 'Returns an error').to.be.instanceOf(Error);
    });
    it('Creates a mongoose model', async () => {
        debug(`Running ${modulename} it creates a mongoose model`);
        debug('connect to database');
        const getDatabase = proxyquire(configDatabase_1.indexPath, {});
        database = await getDatabase.runDatabaseApp();
        debug('create mongoose model');
        const model = database.createModel(testModel, testSchema, testCollection);
        debug('run tests');
        expect(model.collection.name, 'Should return a mongoose model').to.eql(testCollection);
    });
    it('Fails to create a mongoose model', async () => {
        debug(`Running ${modulename} it - fails to create a mongoose model`);
        debug('connect to database');
        const getDatabase = proxyquire(configDatabase_1.indexPath, {});
        database = await getDatabase.runDatabaseApp();
        const dummyCollection = {};
        try {
            debug('fail to create a Mongoose model');
            database.createModel(testModel, testSchema, dummyCollection);
            expect.fail('Should not have reached this point');
        }
        catch (err) {
            debug('run tests');
            expect(err.message, 'Should be a connection error').to.eql('collection name must be a String');
        }
    });
    it('tests sending no logger or dumpError', async () => {
        debug(`Running ${modulename} it - tests sending no logger or dumpError`);
        debug('connect to database without configuring logger or dumpError');
        const connectionUrl = configDatabase_1.getMongoUri();
        const connectOptions = configDatabase_1.getConnectionOptions();
        database = new configDatabase_1.filepaths.Database(connectionUrl, connectOptions);
        database.dbConnection = await database.dbConnectionPromise;
        debug('run tests');
        if (database && database.dbConnection && database.dbConnection.db) {
            expect(database.dbConnection.db.databaseName, 'Should return a database connection named <dbName>').to.equal(dbName);
            expect(database.dbConnection.readyState, 'Connection should be open').to.equal(1 /* Connected */);
        }
        else {
            expect(assert_1.fail('database or dbConnection or db is falsy'));
        }
    });
});
//# sourceMappingURL=database.test.js.map