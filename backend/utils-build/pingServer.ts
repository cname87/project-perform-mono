/**
 * @description
 * This module provides a utility function to allow a test that the server is up.
 * It pings the localhost server until it is up or else it times out after a number of attempts (with 1s intervals).
 *
 * @params The number of attempts to be made can be sent as an argument in the function call.  The default is 10 attempts.
 *
 * @returns a promise that resolves to the http response once the server responds or rejects with an error with err.message = 'Connection failed if it fails to connect.
 *
 * Usage
 * This function is imported, run, and the returned promise from the function is actioned as desired.
 */

/* import configuration parameters into process.env */
import '../src/utils/src/loadEnvFile';

/* external dependencies */
import request from 'request-promise-native';
import util from 'util';
const sleep = util.promisify(setTimeout);

/* internal dependencies */

/* server access options */
const options = {
  url: 'http://localhost:8080/',
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
        console.log('Connect to local host' + ` - attempt ${tryConnectCount}`);
        response = await request.get(options);
        resolve(response);
        break; // loop will continue even though promise resolved
      } catch (err) {
        console.log(
          'Failed to connect to local host' + ` - attempt ${tryConnectCount}`,
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
