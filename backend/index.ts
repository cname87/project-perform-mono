// /* start gcp debug if in production debug mode */
// import debugAgent = require('@google-cloud/debug-agent');
// import profilerAgent = require('@google-cloud/profiler');

// if (process.env.NODE_ENV === 'production') {
//   debugAgent.start();
//   profilerAgent.start({
//     serviceContext: {
//       service: 'default',
//     },
//   });
// }

/* import configuration parameters into process.env */
/* the .env files must be in  */
import './utils/src/loadEnvFile';

/* imports */
import path = require('path');

/* file header */
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* run the server */
import('./server/src/index');
