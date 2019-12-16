import { setupDebug } from '../src/utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
const expect = chai.expect;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

import { uploadFile } from './syncGCPStorage';

describe('Sync with GCP Local Storage', () => {
  debug(`Running ${modulename} describe - Sync with GCP Local Storage`);

  afterEach('delete file', async () => {
    debug(`Running ${modulename} afterEach - delete file`);
  });

  it('tests xxx', async () => {
    debug(`Running ${modulename} it - tests xxx`);

    debug('download a file');

    debug('run tests');
    expect(uploadFile).not.to.throw();
  });
});
