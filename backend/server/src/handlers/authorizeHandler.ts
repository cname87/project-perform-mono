import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

import { Response, NextFunction } from 'express';
import expressJwtPermissions = require('express-jwt-permissions');
import { IRequestApp } from '../configServer';

/**
 * Authorizes the user & request combination.
 * Case 1:
 * It allows the request only when the user has permission to access the configured database, i.e. the 'test' Vs the production 'perform' database.
 */
export const authorizeHandler = (
  req: IRequestApp,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running authorizeHandler');

  // /* the user will need 'all:testDB' permission if the test database is in use, otherwise 'all:performDB' is required */
  const requiredPermission =
    process.env.DB_MODE === 'test' ? 'all:testDB' : 'all:performDB';

  /* server requests use a grant type of client-credentials and the permissions are contained in auth.scope */
  const permissionsProperty =
    req.auth!['gty'] === 'client-credentials' ? 'scope' : 'permissions';

  /* this will call next(err) on error => catch with an error handler next */
  const checkPermissions = expressJwtPermissions({
    requestProperty: 'auth',
    permissionsProperty,
  }).check(requiredPermission);

  checkPermissions(req, res, next);
};
