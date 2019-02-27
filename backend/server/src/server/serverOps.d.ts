/**
 * The exported server constructor.
 */
export declare class Server {
  name: string;
  logger: object;
  dumpError: (err: any) => void;
  listenErrors: number;
  expressServer: object;
  setupServer: (...params: any) => any;
  listenServer: (...params: any) => any;
  stopServer: (...params: any) => any;
  configServer: (...params: any) => any;
  constructor();
}
//# sourceMappingURL=serverOps.d.ts.map
