/**
 * This module sets all configuration parameters for the
 * server application.
 * It must be stored in the same directory as the index.js file.
 */
import * as LOGGER from './utils/logger';
import * as DUMPERROR from './utils/dumperror';
interface IConfig {
  readonly LOGGER: {
    Logger: typeof LOGGER.Logger;
  };
  readonly DUMPERROR: {
    DumpError: typeof DUMPERROR.DumpError;
  };
  readonly [index: string]: any;
}
export declare const config: IConfig;
export {};
//# sourceMappingURL=.config.d.ts.map
