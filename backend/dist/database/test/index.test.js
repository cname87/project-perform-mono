"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/*
 * external dependencies
 */
/* set up mocha, sinon & chai */
const chai = require("chai");
require("mocha");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
    prefix: '',
});
/* use proxyquire for index.js module loading */
const proxyquireObject = require("proxyquire");
/* ensure fresh load each time */
const proxyquire = proxyquireObject.noPreserveCache();
/*
 * internal dependencies
 */
const configDatabase_1 = require("../src/configDatabase");
/*
 * tests
 */
describe('index database connection', () => {
    debug(`Running ${modulename} describe - index database connection`);
    it('has readystate = Connected', async () => {
        debug(`Running ${modulename} it - has readystate = Connected`);
        debug('running database index.js');
        const index = proxyquire(configDatabase_1.indexPath, {});
        debug('creating database connection');
        const database = await index.runDatabaseApp();
        debug('test for an open database connection');
        database.dbConnection
            ? expect(database.dbConnection.readyState).to.eql(1 /* Connected */)
            : expect.fail(true, false, 'no dbConnection object');
        debug('close database connection');
        database.closeConnection(database.dbConnection);
    });
});
//# sourceMappingURL=index.test.js.map