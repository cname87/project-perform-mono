/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file.
 * Handles calls to <api-prefix>/members
 */

/* import external dependencies */
import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

export const addMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running addMember`);

  if (!(context && context.request && context.request.body)) {
    const err: Perform.IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'context not supplied',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    return next(err);
  }
  const memberNoId = context.request.body as Perform.IMemberNoId;
  const { membersHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { logger } = req.app.appLocals;
  const { dumpError } = req.app.appLocals;

  membersHandlers
    .addMember(req, memberNoId)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err) => {
      logger.error(`${modulename}: handler addMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const getMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getMember`);

  if (!(context && context.request && context.request.params)) {
    const err: Perform.IErr = {
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

  const { membersHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { logger } = req.app.appLocals;
  const { dumpError } = req.app.appLocals;

  membersHandlers
    .getMember(req, id)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(`${modulename}: handler getMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const getMembers = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getMembers`);

  let name = '';
  if (context && context.request && context.request.query) {
    name = context.request.query.name as string;
  }
  const { membersHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { logger } = req.app.appLocals;
  const { dumpError } = req.app.appLocals;

  membersHandlers
    .getMembers(req, name)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(`${modulename}: handler getMembers returned error`);
      dumpError(err);
      next(err);
    });
};

export const updateMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running updateMember`);

  if (!(context && context.request && context.request.body)) {
    const err: Perform.IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'context not supplied',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    return next(err);
  }
  const member = context.request.body as Perform.IMember;
  const { membersHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { logger } = req.app.appLocals;
  const { dumpError } = req.app.appLocals;

  membersHandlers
    .updateMember(req, member)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(`${modulename}: handler updateMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const deleteMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running deleteMember`);

  if (!(context && context.request && context.request.params)) {
    const err: Perform.IErr = {
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

  const { membersHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { logger } = req.app.appLocals;
  const { dumpError } = req.app.appLocals;

  membersHandlers

    .deleteMember(req, id)
    .then((number) => {
      const payload = { count: number };
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(`${modulename}: handler deleteMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const deleteMembers = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running deleteMembers`);

  const { membersHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { logger } = req.app.appLocals;
  const { dumpError } = req.app.appLocals;

  membersHandlers
    .deleteMembers(req)
    .then((number) => {
      const payload = { count: number };
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      logger.error(`${modulename}: handler deleteMembers returned error`);
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
