/*
 * Handles http calls routed through the api router.
 * Handles calls to <api-prefix>/members
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* import external dependencies */
import { NextFunction, Response } from 'express';
import { Context } from 'openapi-backend';

/* import local types */
import { IRequestApp } from '../../configServer';

export const getMember = (
  // context: Context,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running getMember');

  const id = req.params.id;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .getMember(req, id)
    .then((payload) => {
      handles.writeJson(res, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler getMember returned error');
      dumpError(err);
      next(err);
    });
};

export const getMembers = (
  context: Context | undefined,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running getMembers');

  let name = '';
  if (
    context &&
    context.request &&
    context.request.params &&
    context.request.params.id
  ) {
    name = context.request.params.name as string;
  }
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .getMembers(req, name)
    .then((payload) => {
      handles.writeJson(res, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler getMembers returned error');
      dumpError(err);
      next(err);
    });
};

export const addMember = (
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  const member = 'x' as any;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .addMember(req, member)
    .then((payload) => {
      handles.writeJson(res, 201, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler addMember returned error');
      dumpError(err);
      next(err);
    });
};

export const deleteMember = (
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  const id = 'x' as any;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .deleteMember(req, id)
    .then((payload) => {
      handles.writeJson(res, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler deleteMember returned error');
      dumpError(err);
      next(err);
    });
};

export const updateMember = (
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  const member = 'x' as any;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .updateMember(req, member)
    .then((payload) => {
      handles.writeJson(res, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler updateMember returned error');
      dumpError(err);
      next(err);
    });
};

export const membersHandlers1 = {
  getMember,
  getMembers,
};
