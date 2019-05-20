/* import configuration parameters into process.env */
/* the .env file must be in process.cwd() */
import * as dotenv from 'dotenv';
dotenv.config();

/* file header */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
// import * as minimist from 'minimist';

/* run the server */
import('./server/src/index');

/* capture command line arguments */
// const argv = minimist(process.argv.slice(2));
