/**
 * @description
 * This module provides a utility function to allow a test that the server is up.
 * It pings the localhost server until it is up or else it times out after a number of attempts (with 1s intervals).
 *
 * @params The number of attempts to be made can be sent as an argument in the function call.  The default is 10 attempts.
 *
 * @returns a promise that resolves to the http response once the server responds or rejects with an error with err.message = 'Connection failed if it fails to connect.
 *
 * * Usage
 * This function is this is imported and the returned promise from the function is actioned as desired.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import appRootObject = require('app-root-path');
const appRoot = appRootObject.toString();
import fs = require('fs');
import request = require('request-promise-native');
import path = require('path');
import util = require('util');
const sleep = util.promisify(setTimeout);

/* internal dependencies */
const ROOT_CA = path.join(appRoot, 'server', 'certs', 'rootCA.crt');
const HTTPS_KEY = path.join(appRoot, 'server', 'certs', 'nodeKeyAndCert.pem');
const HTTPS_CERT = path.join(appRoot, 'server', 'certs', 'nodeKeyAndCert.pem');

/* server access options */
const options = {
  url: 'https://localhost:8080/',
  key: fs.readFileSync(HTTPS_KEY),
  cert: fs.readFileSync(HTTPS_CERT),
  ca: fs.readFileSync(ROOT_CA),
};
const pingServer = (numRetries = 10) => {
  let response;
  return new Promise(async (resolve, reject) => {
    for (
      let tryConnectCount = 1;
      tryConnectCount <= numRetries;
      tryConnectCount++
    ) {
      try {
        debug(
          modulename +
            ': connect to local host' +
            ` - attempt ${tryConnectCount}`,
        );
        response = await request.get(options);
        resolve(response);
        break; // loop will continue even though promise resolved
      } catch (err) {
        debug(
          modulename +
            ': failed to connect to local host' +
            ` - attempt ${tryConnectCount}`,
        );
        await sleep(1000);
        continue;
      }
    }

    /* if loop ends without earlier resolve() */
    reject(new Error('Connection failed'));
  });
};

export { pingServer };
