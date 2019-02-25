'use strict';

/**
 * This module provides a utility to allow a launch configuration test that the
 * server is up before proceeding.  It pings the localhost server until it is up
 * or else it times out after 20 attempts (with 1s intervals).
 * It logs a message to the console before returning.
 *
 * Task Usage:
 * Run this file as the argument to node.exe.
 *
 * To Do:
 * Split the executable and caller out so the main function can be loaded and
 * called from any js file e.g. test scripts.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug = require('debug')('PP_' + modulename);
debug(`Starting ${modulename}`);

/* internal dependencies */
const { config } = require('../dist/.config');

/* external dependencies */
const httpRequest = require('request-promise-native');
const fs = require('fs');
const util = require('util');
const sleep = util.promisify(setTimeout);

const options = {
    url: 'https://localhost:1337/',
    key: fs.readFileSync(config.HTTPS_KEY),
    cert: fs.readFileSync(config.HTTPS_CERT),
    ca: fs.readFileSync(config.DB_CA),
};
const serverIsUp = () => {

    let response;
    return new Promise(async function(resolve, reject) {

        for (let tryConnectCount = 1;
            tryConnectCount <= 20; tryConnectCount++) {

            try {

                debug(modulename + ': connect to local host' +
                    ` - attempt ${tryConnectCount}`);
                response = await httpRequest(options);
                resolve(response);
                break; // loop will continue even though promise resolved

            } catch (err) {

                debug(modulename + ': failed to connect to local host' +
                    ` - attempt ${tryConnectCount}`);
                await sleep(1000);
                continue;

            }

        }

        /* if loop ends without earlier resolve() */
        reject(new Error('Connection failed'));

    });

};

/* try connect to server until it's up and then return and exit */
serverIsUp()
    .then(() => {

        console.log('Connected to server');
        return;

    })
    .catch((err) => {

        console.error(err.message);
        return;

    });

module.exports = serverIsUp;
