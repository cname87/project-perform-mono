/* set proxy target dependent on whether calling environment is GCP Production, GCP staging or local development - the GCP production and staging environments set NODE_ENV */

let target;
switch (process.env.E2E) {
  case 'production': {
    target = 'https://project-perform.appspot.com';
    break;
  }
  case 'staging': {
    target = 'http://backend:8080';
    break;
  }
  default: {
    target = 'http://localhost:8080';
    break;
  }
}

const config = [
  {
    context: ['/api-v1'],
    target,
    secure: false,
    logLevel: 'debug',
  },
];

module.exports = config;
