const dotenv = require('dotenv');
const findup = require('find-up');
/* import configuration parameters */
const envPath = findup.sync('.env-e2e-production', { cwd: __dirname });
dotenv.config({ path: envPath });

exports.config = require('./protractor-common.conf').config;
