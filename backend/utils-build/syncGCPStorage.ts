/**
 * Utility to upload .env and other secret files to GCP Local Storage.
 *
 * When GCP triggers a build from github it needs to copy the .env and database certs files from a GCP Local Storage bucket which means that the file on the GCP Local Storage environment must be in sync with the local development environment.
 *
 * This utility is ONLY executed during development environment backend or frontend builds, i.e. not from GCP - an environment variable set before a GCP Build ensures that the utility execution is skipped during GCP Builds.
 *
 * Usage:
 *
 * The utility is run from an npm script:
 * "npm run ts-node syncGCPStorage.js <parameter>".
 *
 * The set of files to be synced is passed in as a parameter:
 * 'env-backend' to download the backend .env files.
 * 'env-frontend' to download the frontend .env files.
 * 'db-certs' to download the datbase certs files.
 * 'storage-key' to download the GCP access key.
 * If an incorrect, or no, parameter is passed in then an error is thrown.
 *
 */

console.log('Syncing secret files with GCP Local Storage');

import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

/* Note: Refer below for the setting of local and remote filepaths etc */

/* set the path to the GCP Storage credentials (as can be called during build i.e. no .env file loaded */
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
  __dirname,
  '..',
  'certs',
  'gcpStorage',
  'gcpStorageKey.json',
);

/* name of the bucket on GCP Local Storage */
const bucketName = 'project-perform-gcp-environment-files';

/* upload a file to gcp */
export const uploadFile = async (srcFilename: string, destFilename: string) => {
  const storage = new Storage();
  const options = {
    destination: destFilename,
  };
  try {
    console.log(`Uploading ${srcFilename} to ${destFilename}.`);
    await storage.bucket(bucketName).upload(srcFilename, options);
  } catch (err) {
    throw err;
  }
  console.log(`${srcFilename} uploaded to gs://${bucketName}/${destFilename}.`);
};

/* set up exact gcp and local filepaths and call upload for each file */
const setFilePathsAndCallUpload = (
  envFiles: string[],
  gsDirectory: string,
  localDirectory: string,
) => {
  for (const file of envFiles) {
    const gsFilePath = gsDirectory + file;
    const localFilePath = path.join(localDirectory, file);
    if (fs.existsSync(localFilePath)) {
      console.log('Local file exists => uploading');
      uploadFile(localFilePath, gsFilePath);
    } else {
      console.log('No local file exists => error');
      throw new Error('No local file exists');
    }
  }
};

/* define a set of download jobs */
const envBackend = {
  /* files to be synced */
  envFiles: ['.envDevelopment', '.envProduction', '.envStaging'],
  /* local directory for backend environment files relative to this file */
  gsDirectory: '',
  /* local directory for backend environment files relative to this file */
  localDirectory: path.resolve(__dirname, '..', '..'),
};
const envFrontendE2e = {
  /* files to be synced */
  envFiles: [
    '.env-e2e-dev',
    '.env-e2e-production',
    '.env-e2e-staging',
  ],
  /* backend directory on GCP Storage - include '/' as POSIX-based */
  gsDirectory: 'frontend/e2e/',
  /* local directory for frontend e2e .env files relative to this file */
  localDirectory: path.resolve(
    __dirname,
    '..',
    '..',
    'frontend',
    'e2e',
  ),
  };
const dbCerts = {
  /* files to be synced */
  envFiles: ['mongoKeyAndCert.pem', 'rootCA.crt'],
  /* backend directory on GCP Storage - include '/' as POSIX-based */
  gsDirectory: 'backend/certs/database/',
  /* local directory for backend database certs files relative to this file */
  localDirectory: path.resolve(
    __dirname,
    '..',
    '..',
    'backend',
    'certs',
    'database',
  ),
};
const storageKey = {
  /* files to be synced */
  envFiles: ['gcpStorageKey.json'],
  /* backend directory on GCP Storage - include '/' as POSIX-based */
  gsDirectory: 'backend/certs/gcpStorage/',
  /* local directory for backend database certs files relative to this file */
  localDirectory: path.resolve(
    __dirname,
    '..',
    '..',
    'backend',
    'certs',
    'gcpStorage',
  ),
};
const downloads = [ envBackend, envFrontendE2e, dbCerts, storageKey ];

/* run the set of downloads */
for (const job of downloads) {
  setFilePathsAndCallUpload(job.envFiles, job.gsDirectory, job.localDirectory);
}
