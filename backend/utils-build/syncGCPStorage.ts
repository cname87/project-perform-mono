/**
 * Utility to sync .env and other secret files from GCP Local Storage.
 *
 * When GCP triggers a build from github it needs to copy the .env and database certs files from a GCP Local Storage bucket which means that the file on the GCP Local Storage environment must be in sync with the local development environment.
 *
 * This utility is ONLY executed during development environment backend or frontend builds:
 * (i) if secret files exist (e.g. when working on the development environment) then copy them to the GCP storage replacing those on the GCP storage thus ensuring that the GCP Local Storage has the latest secret files.
 * (ii) if no secret files exist (e.g. deleted in error) then copy them from the GCP storage to the local development environment.
 *
 * Note: An environment variable set before a GCP Build ensures that the utility execution is skipped during GCP Builds.
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
 * If an incorrect, or no, parameter is passed in then an error is thrown.
 *
 */

console.log('Syncing secret files with GCP Local Storage');

import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

/* Note: Refer to  the switch operation below for the setting of local and remote filepaths etc */

/* set the sync operation */
let operation = 'error';
operation =
  process.env.IS_GCP_BUILD === 'true'
    ? /* if being built from GCP Build then don't sync */
      (operation = 'no-operation')
    : /* the operation is passed in as the second parameter */
      /* 'env-backend' to sync backend .env files
  /* 'env-frontend' to sync frontend .env files */
      /* 'db-certs' to sync database certs files */
      (operation = process.argv[2]);

/* set the path to the GCP Storage credentials */
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
  __dirname,
  '..',
  'certs',
  'gcpStorage',
  'GCP_StorageKey.json',
);

/* name of the bucket on GCP Local Storage */
const bucketName = 'project-perform-gcp-environment-files';

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

export const downloadFile = async (
  srcFilename: string,
  destFilename: string,
) => {
  const storage = new Storage();

  const options = {
    destination: destFilename,
  };

  try {
    console.log(`Downloading ${srcFilename} to ${destFilename}.`);
    await storage
      .bucket(bucketName)
      .file(srcFilename)
      .download(options);
  } catch (err) {
    /* delete destination file as an error leaves an empty file */
    fs.unlinkSync(destFilename);
    throw err;
  }

  console.log(
    `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`,
  );
};

const operateOnFiles = (
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
      console.log('No local file exists => downloading');
      downloadFile(gsFilePath, localFilePath);
    }
  }
};
switch (operation) {
  case 'env-backend': {
    /* files to be synced */
    const envFiles = ['.envDevelopment', '.envProduction', '.envStaging'];
    /* backend directory on GCP Storage - include '/' as POSIX-based */
    const gsDirectory = 'env-backend/';
    /* local directory for backend environment files relative to this file */
    const localDirectory = path.resolve(__dirname, '..', '..');
    operateOnFiles(envFiles, gsDirectory, localDirectory);
    break;
  }
  case 'env-frontend-e2e': {
    /* files to be synced */
    const envFiles = [
      '.env-e2e-dev',
      '.env-e2e-production',
      '.env-e2e-staging',
    ];
    /* backend directory on GCP Storage - include '/' as POSIX-based */
    const gsDirectory = 'env-frontend-e2e/';
    /* local directory for frontend e2e .env files relative to this file */
    const localDirectory = path.resolve(
      __dirname,
      '..',
      '..',
      'frontend',
      'e2e',
    );
    operateOnFiles(envFiles, gsDirectory, localDirectory);
    break;
  }
  case 'db-certs': {
    /* files to be synced */
    const envFiles = ['mongoKeyAndCert.pem', 'rootCA.crt'];
    /* backend directory on GCP Storage - include '/' as POSIX-based */
    const gsDirectory = 'certs-database/';
    /* local directory for backend database certs files relative to this file */
    const localDirectory = path.resolve(
      __dirname,
      '..',
      '..',
      'backend',
      'certs',
      'database',
    );
    operateOnFiles(envFiles, gsDirectory, localDirectory);
    break;
  }
  case 'no-operation': {
    /* don't sync when running a build on GCP Build */
    break;
  }
  default: {
    throw new Error(
      'Error syncing GCP Storage - invalid operations parameter passed in',
    );
  }
}
