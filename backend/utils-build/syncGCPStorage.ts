/**
 * Utility to sync .env and other secret files from GCP Local Storage.
 *
 * When GCP triggers a build from github it needs to copy the .env and database certs files from a GCP Local Storage bucket which means that the file on the GCP Local Storage environment must be in sync with the ones on the local development environment.
 *
 * This utility is run during backend or frontend builds:
 * (i) if secret files exist (e.g. when working on the development environment) then copy them to the GCP storage replacing those on the GCP storage thus ensuring that the GCP Local Storage has the latest secret files.
 * (ii) if no secret files exist, (e.g. when working on the GCP build environment), then copy them from the GCP storage to the environment thus ensuring the GCP environment has access to the required files.
 *
 * Usage:
 *
 * The set of files to be copied is passed in as a parameter:
 * 'env-backend' to download the backend .env files to the /.
 * 'env-frontend' to download the frontend .env files to /frontend/e2e.
 * 'db-certs' to download the datbase certs files to /backend/certs.
 *
 * Called in an npm script: "npm run syncGCPStorage.js <parameter>".
 *
 * If an incorrect, or no, parameter is passed in then an error is thrown.
 *
 */

console.log('Syncing secret files with GCP Local Storage');

import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

/* operation passed in as the second parameter */
/* 'env-backend' to sync backend .env files
/* env-frontend' to sync frontend .env files and database certs file */
const operation = process.argv[2];

/* set GCP Local Storage credentials */
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
  __dirname,
  '..',
  'certs',
  'gcpStorage',
  'GCP_StorageKey.json',
);

/* name of the bucket on GCP Local Storage */
const bucketName = 'project-perform-gcp-environment-files';
/* local directory for backend environment files relative to this file */
const backendEnvDirectory = path.resolve(__dirname, '..', '..');
/* local directory for frontend e2e environment files relative to this file */
const frontendE2eEnvDirectory = path.resolve(
  __dirname,
  '..',
  '..',
  'frontend',
  'e2e',
);
/* local directory for backend database certs files relative to this file */
const databaseCertsDirectory = path.resolve(
  __dirname,
  '..',
  '..',
  'backend',
  'certs',
  'database',
);

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
    operateOnFiles(envFiles, gsDirectory, backendEnvDirectory);
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
    operateOnFiles(envFiles, gsDirectory, frontendE2eEnvDirectory);
    break;
  }
  case 'db-certs': {
    /* files to be synced */
    const envFiles = ['mongoKeyAndCert.pem', 'rootCA.crt'];
    /* backend directory on GCP Storage - include '/' as POSIX-based */
    const gsDirectory = 'certs-database/';
    operateOnFiles(envFiles, gsDirectory, databaseCertsDirectory);
    break;
  }
  default: {
    throw new Error(
      'Error syncing GCP Storage - invalid operations parameter passed in',
    );
  }
}
