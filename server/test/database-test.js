'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('Database connection', function() {

    const path = require('path');
    const appRoot = require('app-root-path').toString();
    const databasePath = '../dist/database/database';
    const { config: configOriginal } = require(path.join(appRoot, 'dist','.config'));
    /* create a copy of config that you can edit */
    const config = {};
    let key = '';
    for (key in configOriginal) {

        if (configOriginal.hasOwnProperty(key)) {

            config[key] = configOriginal[key];

        }

    };

    const proxyquire = require('proxyquire');
    const mongoose = require('mongoose');
    const EventEmitter = require('events');

    const chai = require('chai');
    const sinon = require('sinon');
    const sinonChai = require('sinon-chai');
    chai.use(sinonChai);
    const expect = chai.expect;
    sinon.assert.expose(chai.assert, {
        prefix: '',
    });

    /* set up default database */
    let database = {};
    let dbConnection;
    let debugStub;
    let debugEnabled = true;

    /* set up a database schema, collection, and model name */
    const testSchema = {
        username: String,
        email: String,
    };
    const testCollection = 'mochaTest';
    const testModel = 'mochaTestModel';

    before('Set up database debug.enabled mock', async function() {

        debugStub = (prefix) => {

            return function debug(message) {

                debug.enabled = debugEnabled;
                require('debug')(prefix)(message);

            };

        };

        /* set up default database */
        const database = proxyquire(databasePath, {}).database;
        database.configDatabase(config);

        debug(modulename + ':\n\n *** Tests start here ***\n\n');

    });

    afterEach('Close dbConnection & restore database', async function() {

        /* close dbConnection */
        if (dbConnection && dbConnection.readyState === 1) {

            await database.closeConnection(dbConnection);


        };

        /* restore default database so not needed within each it */
        database = proxyquire(databasePath, {}).database;
        database.configDatabase(config);

    });

    it('Connects to a closed database', async function() {


        /* get and configure a database */
        /* using mongoose to simulate a not started database server
         * as otherwise very slow */
        let numTries = 0;
        database = proxyquire(databasePath, {

            'mongoose': {
                createConnection: (url, connectOptions) => {

                    if (numTries === 0) {

                        numTries++;
                        throw new Error('Test error');

                    } else {

                        const temp =  mongoose.createConnection(url, connectOptions);
                        console.log(temp);
                        return temp;

                    }

                },
                ['set']: mongoose.set,
            },

            ['./extDatabaseService']: {

                startDB: () => {

                    return;

                },

            },

        }).database;

        database.configDatabase(config);

        /* connect and test */
        dbConnection = await database.connectToDB();
        expect(dbConnection.db.databaseName,
            'Should return a database connection')
            .to.equal(config.DB_NAME);
        expect(dbConnection.readyState,
            'Connection should be open')
            .to.equal(1);
        await database.closeConnection(dbConnection);

    });

    it('Connects to an open database', async function() {

        /* test not printing database stats */
        debugEnabled = false;
        database = proxyquire(databasePath, {
            'debug': debugStub,
        }).database;
        /* new database instance => configure */
        database.configDatabase(config);

        dbConnection = await database.connectToDB();
        expect(dbConnection.db.databaseName,
            'Should return a database connection')
            .to.equal(config.DB_NAME);
        expect(dbConnection.readyState,
            'Connection should be open')
            .to.equal(1);
        await database.closeConnection(dbConnection);

    });

    it('Fails to a connect to a database with ' +
        'database not started and startDB ' +
        'throwing an error', async function() {

        /* stub mongoose to simulate a createConnection failure as
         * if external database is not up (rather than shutting external
         * database, which is slow
         * stub database.startDB function to throw an error */
        const startDBStub = () => {

            throw new Error('Test error');

        };
        database = proxyquire(databasePath, {
            [config.START_DB_SERVICE]: {

                startDB: startDBStub,

            },
            'mongoose': {
                createConnection: () => {

                    throw new Error('Test error');

                },
            },
        }).database;
        database.configDatabase(config);

        try {

            await database.connectToDB();
            expect.fail('Should not have reached this point');

        } catch (err) {

            expect(err.message, 'Should be a test error')
                .to.eql('Test error');

        };

    });

    it('Closes an open database connection', async function() {

        dbConnection = await database.connectToDB();
        expect(dbConnection.readyState,
            'Connection should be open')
            .to.eql(1);
        await database.closeConnection(dbConnection);
        expect(dbConnection.readyState,
            'Connection should be closed')
            .to.eql(0);

    });

    it('Closes a closed database connection', async function() {

        dbConnection = await database.connectToDB();
        await database.closeConnection(dbConnection);
        expect(dbConnection.readyState,
            'Connection should be closed')
            .to.eql(0);
        await database.closeConnection(dbConnection);
        expect(dbConnection.readyState,
            'Connection should be closed')
            .to.eql(0);

    });

    it('Closes an invalid database connection', async function() {

        dbConnection = {};
        const result = await database.closeConnection(dbConnection);
        expect(result, 'Returns an error')
            .to.be.instanceOf(Error);

    });

    it('Fails to connect to a database', async function() {

        /* stub the database server host name function */
        const revertDbHost = config.DB_HOST;
        config.DB_HOST = 'dummyHost';

        database = proxyquire(databasePath, {
            [path.join(appRoot, 'dist', '.config')]: config,
        }).database;
        database.configDatabase(config);

        try {

            await database.connectToDB();
            expect.fail('Should not have reached this point');

        } catch (err) {

            /* restore database */
            config.DB_HOST = revertDbHost;

            expect(err.name, 'Should be a MongoNetworkError')
                .to.eql('MongoNetworkError');

        };

    });

    it('Creates a mongoose model', async function() {

        /* connect to the database and create a db connection */
        const dbConnection = await database.connectToDB();
        const model = database.createModel(testModel, testSchema,
            testCollection, dbConnection);
        await database.closeConnection(dbConnection);
        expect(model.collection.name, 'Should return a mongoose model')
            .to.eql(testCollection);

    });

    it('Fails to create a mongoose model', async function() {

        try {

            database.createModel(testModel, testSchema,
                testCollection, 'dummyConnection');
            expect.fail('Should not have reached this point');

        } catch (err) {

            expect(err.name, 'Should be a connection error')
                .to.eql('TypeError');

        };

    });

    it('Creates and closes a MongoStore', async function() {

        /* create a mongoStore */
        let mongoStore = await database.createStore();
        expect(mongoStore.client.isConnected(),
            'Should return an open MongoStore')
            .to.eql(true);

        /* close MongoStore database connection */
        mongoStore = await database.closeStore(mongoStore);
        expect(mongoStore.client.isConnected(),
            'Should return a closed MongoStore')
            .to.eql(false);

        /* close an already closed MongoStore database connection */
        mongoStore = await database.closeStore(mongoStore);
        expect(mongoStore.client.isConnected(),
            'Should return a closed MongoStore')
            .to.eql(false);

    });

    it('Fails to create a MongoStore', async function() {

        /* stub the database connect-mongodb-session function
         * to return a class that is an event emitter
         * and emits an error event on the next event cycle */
        /* note that if simply you send in a dummy host to create
         * an error, connect-mongodb-session will leave a listener
         * and timer hanging and mocha won't exit */
        class MongoStoreDebug extends EventEmitter {

            constructor() {

                super();
                this.emitEvent();

            }
            emitEvent() {

                process.nextTick(() => {

                    this.emit('error', new Error('Test error'));

                });

            }

        }

        function connectMongoDebug() {

            return MongoStoreDebug;

        };

        database = proxyquire(databasePath, {
            'connect-mongodb-session': connectMongoDebug,
        }).database;
        database.configDatabase(config);

        try {

            await database.createStore();
            expect.fail('Should not have reached this point');

        } catch (err) {

            /* restore database */
            database = proxyquire(databasePath, {}).database;

            expect(err.message, 'Should be a connection error')
                .to.eql('Test error');

        };

    });

    it('Fails to close a MongoStore', async function() {

        const stubStore = {

            client: {

                close: () => {

                    throw new Error('Test error');

                },
            },
        };


        const err = await database.closeStore(stubStore);

        expect(err.message, 'Should be a connection error')
            .to.eql('Test error');

    });

    it('Creates an Express session', async function() {

        /* create a mongoStore */
        let mongoStore = await database.createStore();
        const expressSession = database.createSession(mongoStore, 'secret');
        /* close MongoStore database connection */
        mongoStore = await database.closeStore(mongoStore);
        expect(expressSession.name,
            'Should return an Express session')
            .to.eql('session');

    });

});
