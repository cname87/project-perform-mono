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
 * Split into a function and caller out so the function can be loaded and
 * called from any js file e.g. test scripts.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import * as appRootObject from 'app-root-path';
const appRoot = appRootObject.toString();
import fs from 'fs';
import httpRequest from 'request-promise-native';
import * as path from 'path';
import util from 'util';
const sleep = util.promisify(setTimeout);

/* internal dependencies */
const ROOT_CA = path.join(appRoot, 'server', 'certs', 'rootCA.crt');
const HTTPS_KEY = path.join(appRoot, 'server', 'certs', 'nodeKeyAndCert.pem');
const HTTPS_CERT = path.join(appRoot, 'server', 'certs', 'nodeKeyAndCert.pem');

const options = {
  url: 'https://localhost:1337/',
  key: fs.readFileSync(HTTPS_KEY),
  cert: fs.readFileSync(HTTPS_CERT),
  ca: fs.readFileSync(ROOT_CA),
};
const serverIsUp = () => {
  let response;
  return new Promise(async (resolve, reject) => {
    for (let tryConnectCount = 1; tryConnectCount <= 20; tryConnectCount++) {
      try {
        debug(
          modulename +
            ': connect to local host' +
            ` - attempt ${tryConnectCount}`,
        );
        response = await httpRequest(options);
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
