/**
 * @description
 * This module provides a utility function to allow a test that the server is up.
 * It pings the localhost server until it is up or else it times out after a number of attempts (with 1s intervals).
 *
 * @params
 * - numTries: The number of attempts to be made can be sent as an argument in the function call.  The default is 10 attempts.
 * - url: The url of the backend server to be pinged.  the default is 'http://localhost:8080/'
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

const pingServer = (numRetries = 10, url = 'http://localhost:8080/') => {
  /* server access options */
  const options = {
    url,
  };
  return new Promise(async (resolve, reject) => {
    for (
      let tryConnectCount = 1;
      tryConnectCount <= numRetries;
      tryConnectCount++
    ) {
      try {
        console.log('Connect to local host' + ` - attempt ${tryConnectCount}`);
        const response = await request.get(options);
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
