/* added as no @types file found */
declare module 'express-force-ssl';
declare module 'http-shutdown';
declare module 'tsscmp';
declare module 'windows-service-controller';
declare module 'flatted/cjs';

/* added to allow a custom event.once() be used in index.js */
declare namespace NodeJS {
  interface Process {
    once(
      event: 'thrownException',
      listener: (err: Error) => Promise<void>,
    ): this;
  }
}

declare interface IConfig {
  readonly [index: string]: any;
}

declare interface IErr extends Error {
  dumped?: boolean;
  status?: string | number;
  code?: number;
}
