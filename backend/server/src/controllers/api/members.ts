/**
 * Handles http calls routed through the Swagger api router.
 * Handles calls to <api-prefix>/members
 */

import {
  Swagger20Request,
  Swagger20Response,
  SwaggerRequestParameter,
  SwaggerRequestParameters,
} from 'swagger-tools';

import * as membersHandles from '../../handlers/members';
import * as utils from '../writer';

interface IParams extends SwaggerRequestParameters {
  id: SwaggerRequestParameter<number>;
  name: SwaggerRequestParameter<string>;
  member: SwaggerRequestParameter<any>;
}

export const getMember = (
  req: Swagger20Request<IParams>,
  res: Swagger20Response,
  _next: any,
) => {
  const id = req.swagger.params['id'].value;
  membersHandles
    .getMember(id)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};

export const getMembers = (
  req: Swagger20Request<IParams>,
  res: Swagger20Response,
  _next: any,
) => {
  const name = req.swagger.params['name'].value;
  membersHandles
    .getMembers(name)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};

export const addMember = (
  req: Swagger20Request<IParams>,
  res: Swagger20Response,
  _next: any,
) => {
  const member = req.swagger.params['member'].value;
  membersHandles
    .addMember(member)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};

export const deleteMember = (
  req: Swagger20Request<IParams>,
  res: Swagger20Response,
  _next: any,
) => {
  const id = req.swagger.params['id'].value;
  membersHandles
    .deleteMember(id)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};

export const updateMember = (
  req: Swagger20Request<IParams>,
  res: Swagger20Response,
  _next: any,
) => {
  const id = req.swagger.params['id'].value;
  const member = req.swagger.params['member'].value;
  membersHandles
    .updateMember(id, member)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};
