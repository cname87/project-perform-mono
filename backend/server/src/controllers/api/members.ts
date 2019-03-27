const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/**
 * Handles http calls routed through the Swagger api router.
 * Handles calls to <api-prefix>/members
 */

import { NextFunction, Request } from 'express';
import {
  Swagger20Request,
  Swagger20Response,
  SwaggerRequestParameter,
  SwaggerRequestParameters,
} from 'swagger-tools';
import * as winston from 'winston';

import { IConfig } from '../../configServer';

/* type with req.swagger and req.app */
type IRequest = Swagger20Request<IParams> & Request;

interface IParams extends SwaggerRequestParameters {
  id: SwaggerRequestParameter<number>;
  name: SwaggerRequestParameter<string>;
  member: SwaggerRequestParameter<any>;
}

export const getMember = (
  req: IRequest,
  res: Swagger20Response,
  next: NextFunction,
) => {
  const id = req.swagger.params['id'].value;
  const config: IConfig = req.app.locals.config;
  const handles = req.app.locals.handles;
  const logger: winston.Logger = req.app.locals.logger;
  const dumpError = req.app.locals.dumpError;

  config.MEMBERS_HANDLER.getMember(req, id)
    .then((payload) => {
      handles.writeJson(res, payload);
    })
    .catch((err) => {
      logger.error(modulename + ': handles getMember returned error');
      dumpError(err);
      next(err);
    });
};

export const getMembers = (
  req: IRequest,
  res: Swagger20Response,
  next: NextFunction,
) => {
  const name = req.swagger.params['name'].value;
  const config = req.app.locals.config as IConfig;

  config.MEMBERS_HANDLER.getMembers(name)
    .then((payload) => {
      req.app.locals.handles.writeJson(res, payload);
    })
    .catch((err) => {
      next(err);
    });
};

export const addMember = (
  req: IRequest,
  res: Swagger20Response,
  next: NextFunction,
) => {
  const member = req.swagger.params['member'].value;
  const config = req.app.locals.config as IConfig;
  const members = req.app.locals.models.Members;
  const handles = req.app.locals.handles;

  config.MEMBERS_HANDLER.addMember(members, member)
    .then((payload) => {
      handles.writeJson(res, payload);
    })
    .catch((err) => {
      next(err);
    });
};

export const deleteMember = (
  req: IRequest,
  res: Swagger20Response,
  next: NextFunction,
) => {
  const id = req.swagger.params['id'].value;
  const config = req.app.locals.config as IConfig;

  config.MEMBERS_HANDLER.deleteMember(id)
    .then((payload) => {
      req.app.locals.handles.writeJson(res, payload);
    })
    .catch((err) => {
      next(err);
    });
};

export const updateMember = (
  req: IRequest,
  res: Swagger20Response,
  next: NextFunction,
) => {
  const id = req.swagger.params['id'].value;
  const config = req.app.locals.config as IConfig;

  const member = req.swagger.params['member'].value;
  config.MEMBERS_HANDLER.updateMember(id, member)
    .then((payload) => {
      req.app.locals.handles.writeJson(res, payload);
    })
    .catch((err) => {
      next(err);
    });
};
