/**
 * Handles http calls routed through the Swagger api router.
 * Handles calls to <api-prefix>/members
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/**
 * Import external dependencies.
 */
import { NextFunction, Response } from 'express';
import {
  Swagger20Request,
  SwaggerRequestParameter,
  SwaggerRequestParameters,
} from 'swagger-tools';

/**
 * Import local types
 */
import { IMember, IRequestApp } from '../../configServer';

/* adding req.swagger to IRequestApp */
type IRequestAppSwagger = Swagger20Request<IParams> & IRequestApp;
/* adding id, name etc to req.swagger.params type */
interface IParams extends SwaggerRequestParameters {
  id: SwaggerRequestParameter<number>;
  name: SwaggerRequestParameter<string>;
  member: SwaggerRequestParameter<IMember>;
}

export const getMember = (
  req: IRequestAppSwagger,
  res: Response,
  next: NextFunction,
) => {
  const id = req.swagger.params.id.value;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersApiHandlers
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
  req: IRequestAppSwagger,
  res: Response,
  next: NextFunction,
) => {
  const name = req.swagger.params.name.value;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersApiHandlers
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
  req: IRequestAppSwagger,
  res: Response,
  next: NextFunction,
) => {
  const member = req.swagger.params.member.value;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersApiHandlers
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
  req: IRequestAppSwagger,
  res: Response,
  next: NextFunction,
) => {
  const id = req.swagger.params.id.value;
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  config.membersApiHandlers
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
  req: IRequestAppSwagger,
  res: Response,
  next: NextFunction,
) => {
  const config = req.app.appLocals.config;
  const handles = req.app.appLocals.miscHandlers;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  const member = req.swagger.params.member.value;
  config.membersApiHandlers
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
