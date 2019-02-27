import debugFunction from 'debug';
export declare const debug: debugFunction.Debugger;
import { config } from '../.config';
export { config };
import * as forever from 'forever-monitor';
export declare const logger: import('winston').Logger;
export declare const dumpError: (err: IErr) => void;
interface IChild extends forever.Monitor {
  running: boolean;
  exitCode: number;
}
export declare let child: IChild;
declare function exit(cause: string): void;
declare function uncaughtException(err: Error): Promise<void>;
declare function unhandledRejection(reason: any, promise: any): Promise<void>;
declare function start(): Promise<void>;
export { start as testStart };
export { exit as testExit };
export { uncaughtException as testUncaughtException };
export { unhandledRejection as testUnhandledRejection };
//# sourceMappingURL=monitor.d.ts.map
