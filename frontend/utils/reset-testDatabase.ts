/**
 * This utility resets the test database.  It deletes all members and loads 10 mock members including one with a configured name that will cause an error when test mode is enabled.
 * Note: The server must be running before this is run.
 * Note that a test is carried out to ensure that the test database is in use and not a production database.  The utility will exit without action if the test database is not in use.
 * Note: global.window is set to a dummy value to avoid an error when config.ts is imported.
 */

import request from 'request-promise-native';
import fs from 'fs';
import path from 'path';

/* need to set a dummy client-side window global as it is referenced in auth0 configuration in config.ts */
global['window'] = {
  location: {
    origin: 'dummy',
  },
};
/* import the member that is configured to trigger an error */
import { errorMember } from '../src/app/config';

const certFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem');
const keyFile = path.resolve(__dirname, '../certs/nodeKeyAndCert.pem');
const caFile = path.resolve(__dirname, '../certs/rootCA.crt');

/* set up mock members here - loaded below */
const mockMembers = [
  { name: 'test10' },
  { name: 'test11' },
  { name: 'test12' },
  { name: 'test13' },
  { name: 'test14' },
  { name: 'test15' },
  { name: 'test16' },
  { name: 'test17' },
  { name: 'test18' },
  { name: errorMember.name }, // used for error testing
];

/* server request helper function */
async function askServer(
  url: string,
  method: 'GET' | 'POST' | 'DELETE',
  body = {},
) {
  const options = {
    url,
    method,
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
    ca: fs.readFileSync(caFile),
    json: true,
    body,
  };
  return request(options);
}

/* clear database, load mockmembers and load start page */
export const resetDatabase = async () => {
  console.log('Running reset and load test database');

  /* the response is { isTestDatabase: <true | false> } */
  const response = await askServer(
    'https://localhost:1337/testServer/isTestDatabase',
    'GET',
  );
  /* exit if we're not working with the test database */
  if (!response || !response.isTestDatabase) {
    console.error('Test database not in use - exiting resetDatbase');
    throw new Error('Trying to reset a non-test database!');
  }

  /* delete all 'test' database members */
  await askServer('https://localhost:1337/members', 'DELETE');

  /* add test database members here */
  await askServer('https://localhost:1337/members', 'POST', mockMembers[0]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[1]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[2]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[3]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[4]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[5]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[6]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[7]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[8]);
  await askServer('https://localhost:1337/members', 'POST', mockMembers[9]);

  console.log('Completed database reset and loaded test members');
};

/* read first argument - 'run' to run the the utility */
const runUtility = process.argv[2];
if (runUtility === 'run') {
  resetDatabase();
}
