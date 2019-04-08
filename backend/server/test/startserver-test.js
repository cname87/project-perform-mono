'use strict';

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

describe('Start server tests', function() {

    const path = require('path');
    const appRoot = require('app-root-path').toString();

    let { config: configOriginal } = require(path.join(appRoot, 'dist', 'server', 'src','configServer'));
    /* create a copy of config that you can edit */
    let config = {};
    let key = '';
    for (key in configOriginal) {

        if (configOriginal.hasOwnProperty(key)) {

            config[key] = configOriginal[key];

        }

    };

    /* internal dumpError and logger utilities */
    const Logger = config.Logger;
    const logger = new Logger();
    const DumpError = config.DumpError;
    const dumpError = new DumpError(logger);

    const chai = require('chai');
    const sinon = require('sinon');
    const sinonChai = require('sinon-chai');

    chai.use(sinonChai);
    const expect = chai.expect;
    sinon.assert.expose(chai.assert, {
        prefix: '',
    });


    let app = {};
    let objects = {};

    before('Set up objects', function() {

        /* set up the objects object */
        app = require('express')();
        objects = app.locals = {
            servers: [], // created http(s) servers
            config: config,
            logger: logger,
            dumpError: dumpError,
        };

    });

    afterEach('Stop servers', async function() {

        /* shutdown the servers after */
        for (let svr of objects['servers']) {

            await svr.stopServer();
            svr.expressServer.removeAllListeners();

        }

        objects['servers'] = [];

    });

    it('Start http server only', async function() {

        /* turn https off */
        config.HTTPS_ON = false;

        try {

            await config.startServer(app, objects.servers, objects.config, objects.logger, objects.dumpError);

        } catch (err) {

            expect.fail(err, null, 'Should not throw an error');

        }
        /* test http server */
        expect(objects.servers[0].expressServer.listening, 'Should return ' +
            'a listening server object').to.eql(true);
        /* test https server */
        expect(objects.servers[1], 'Should be undefined').to.eql(undefined);

    });

    it('Start http and https server', async function() {

        /* turn https on */
        config.HTTPS_ON = true;

        try {

          await config.startServer(app, objects.servers, objects.config, objects.logger, objects.dumpError);

        } catch (err) {

            expect.fail(err, null, 'Should not throw an error');

        }
        /* test http server */
        expect(objects.servers[0].expressServer.listening, 'Should return ' +
            'a listening server object').to.eql(true);
        /* test https server */
        expect(objects.servers[1].expressServer.listening, 'Should return ' +
            'a listening server object').to.eql(true);

    });

    it('Throws an error on failed listening request', async function() {

        try {

            /* start server twice and second listen attempt will fail */
            await config.startServer(app, objects.servers, objects.config, objects.logger, objects.dumpError);
            await config.startServer(app, objects.servers, objects.config, objects.logger, objects.dumpError);
            expect.fail(true, false, 'should not have reached here');

        } catch (err) {

            expect(err.code, 'Should throw a port busy error')
                .to.eql('EADDRINUSE');

        }

    });

});
