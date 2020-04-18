/**
 * Utility to upload .env and other secret files to GCP Local Storage.
 *
 * When GCP triggers a build from github it needs to copy the .env and database certs files from a GCP Local Storage bucket which means that the file on the GCP Local Storage environment must be in sync with those on the local development environment.
 *
 * This utility is ONLY executed during development environment backend or frontend builds, i.e. not from GCP - an environment variable set before a GCP Build ensures that the utility execution is skipped during GCP Builds.
 *
 * Usage:
 *
 * The utility is run from an npm script:
 * "npm run ts-node syncGCPStorage.js.
 *
 * This utility has the following configuration:
 * - Path to gcpStorageKey.json for GOOGLE_APPLICATION_CREDENTIALS environment variable.
 * - Cloud Storage bucket name.
 * - Paths to secret files to be uploaded.
 * - Paths on Cloud Storage.
 *
 * NOTE: The structure of the Cloud storage bucket (set by the paths on Cloud Storage below) used must match the directory structure of the application as when the files are downloaded during cloud build they are copied as per the file structure, (and some directories are created as git will not save empty directories).  This is guaranteed by just configuring a deltaPath from a root path (where package.json is) and constructing the local and Cloud Storage filepaths from that delta path.
 *
 * NOTE: The utility includes an integrated test - it reads the uploaded time from Cloud Storage before and after the upload and passes if the difference between before and after is not negative.
 *
 */

import path from 'path';
import fs from 'fs';
import findup from 'find-up';
import { Storage } from '@google-cloud/storage';

console.log('Uploading secret files with GCP Local Storage');
const storage = new Storage();

/* find directory (upwards) containing package.json */
export const rootPath = path.dirname(
  findup.sync('package.json', { cwd: __dirname })!,
);

/* set the path to the GCP Storage credentials here (as well as in the .env files as this may be called when no .env file is loaded) */
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
  rootPath,
  'backend',
  'certs',
  'gcpStorage',
  'gcpStorageKey.json',
);

/* name of the bucket on GCP Local Storage */
export const bucketName = 'project-perform-gcp-environment-files';

/* define a set of upload jobs */

const envBackend = {
  /* files to be uploaded */
  filesToUpload: ['.envDevelopment', '.envProduction', '.envStaging'],
  /* path relative to rootpath */
  deltaPath: '',
};
const envFrontendE2e = {
  /* files to be uploaded */
  filesToUpload: ['.env-e2e-dev', '.env-e2e-production', '.env-e2e-staging'],
  /* path relative to rootpath */
  deltaPath: 'frontend/e2e/',
};
const dbCerts = {
  /* files to be uploaded */
  filesToUpload: ['mongoKeyAndCert.pem', 'rootCA.crt'],
  /* path relative to rootpath */
  deltaPath: 'backend/certs/database/',
};
const storageKey = {
  /* files to be uploaded */
  filesToUpload: ['gcpStorageKey.json'],
  /* path relative to rootpath */
  deltaPath: 'backend/certs/gcpStorage/',
};
export const uploadJobs = [envBackend, envFrontendE2e, dbCerts, storageKey];

/* upload a file to gcp */
const uploadFile = async (srcFilename: string, destFilename: string) => {
  const options = {
    destination: destFilename,
  };
  try {
    console.log(`Uploading ${srcFilename} to ${destFilename}.`);
    await storage.bucket(bucketName).upload(srcFilename, options);
  } catch (err) {
    console.error(
      `Error uploading ${srcFilename} to gs://${bucketName}/${destFilename}.`,
    );
    throw err;
  }
};

enum FirstRead {
  TRUE = 1,
  FALSE,
}
/* get metadata on a file from the Cloud Storage */
const getUploadedTime = async (
  bucket = bucketName,
  filename: string,
  firstRead: FirstRead,
) => {
  try {
    const [metadata] = await storage
      .bucket(bucket)
      .file(filename)
      .getMetadata();
    /* return # of ms */
    return Date.parse(metadata.updated);
  } catch (err) {
    if (firstRead === FirstRead.TRUE) {
      /* if the file is not there before you upload the file then return an uploaded time of 0ms */
      return 0;
    }
    /* if an error is thrown on the attempt to get the upload metadata after you have uploaded the file then throw an error */
    console.error(
      `Error getting metadata on ${filename} from gs://${bucketName}.`,
    );
    throw err;
  }
};

/* set up exact gcp and local filepaths and call upload for each file */
export const setFilePathsAndCallUpload = async (
  filesToUpload: string[],
  deltaPath: string,
) => {
  for (const file of filesToUpload) {
    /* construct local and storage path from the deltaPath */
    const gsFilePath = deltaPath + file;
    const localFilePath = path.resolve(rootPath, deltaPath, file);
    if (fs.existsSync(localFilePath)) {
      const before = await getUploadedTime(
        bucketName,
        gsFilePath,
        FirstRead.TRUE,
      );
      await uploadFile(localFilePath, gsFilePath);
      const after = await getUploadedTime(
        bucketName,
        gsFilePath,
        FirstRead.FALSE,
      );
      /* test uploaded time before Vs after */
      if (before - after < 0) {
        console.log('Upload test passed');
      } else {
        console.error('Unknown error uploading a file');
        throw new Error('Unknown error uploading a file');
      }
    } else {
      console.error('No local file exists => error');
      throw new Error('No local file exists');
    }
  }
};

const runUploads = async () => {
  /* run the set of uploads */
  for (const job of uploadJobs) {
    await setFilePathsAndCallUpload(job.filesToUpload, job.deltaPath);
  }
};

runUploads();
