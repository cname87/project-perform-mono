/*
 * Handles http calls routed through the api router.
 * Handles calls to <api-prefix>/members
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* import external dependencies */
import { NextFunction, Response } from 'express';
import { Context } from 'openapi-backend';

/* import local types */
import { IRequestApp, IMember, IErr, IMemberNoId } from '../../configServer';

export const addMember = (
  context: Context | undefined,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running addMember');

  if (!(context && context.request && context.request.body)) {
    const err: IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'context not supplied',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    return next(err);
  }
  const memberNoId = context.request.body as IMemberNoId;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .addMember(req, memberNoId)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler addMember returned error');
      dumpError(err);
      next(err);
    });
};

export const getMember = (
  context: Context | undefined,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running getMember');

  if (!(context && context.request && context.request.params)) {
    const err: IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'context not supplied',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    return next(err);
  }

  const idString = context.request.params.id as string;
  const id = Number.parseInt(idString, 10);

  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .getMember(req, id)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
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
  if (context && context.request && context.request.query) {
    name = context.request.query.name as string;
  }
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .getMembers(req, name)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler getMembers returned error');
      dumpError(err);
      next(err);
    });
};

export const updateMember = (
  context: Context | undefined,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running updateMember');

  if (!(context && context.request && context.request.body)) {
    const err: IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'context not supplied',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    return next(err);
  }
  const member = context.request.body as IMember;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .updateMember(req, member)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler updateMember returned error');
      dumpError(err);
      next(err);
    });
};

export const deleteMember = (
  context: Context | undefined,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running deleteMember');

  if (!(context && context.request && context.request.params)) {
    const err: IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'context not supplied',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    return next(err);
  }

  const idString = context.request.params.id as string;
  const id = Number.parseInt(idString, 10);

  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers

    .deleteMember(req, id)
    .then((number) => {
      const payload = { count: number };
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler deleteMember returned error');
      dumpError(err);
      next(err);
    });
};

export const deleteMembers = (
  context: Context | undefined,
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running deleteMembers');

  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersHandlers
    .deleteMembers(req)
    .then((number) => {
      const payload = { count: number };
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handler deleteMembers returned error');
      dumpError(err);
      next(err);
    });
};

export const membersApi = {
  getMember,
  getMembers,
  addMember,
  deleteMember,
  deleteMembers,
  updateMember,
};
