const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

import ms from 'ms';
import jwt = require('express-jwt');
import jwksRsa = require('jwks-rsa');
import { Request, Response, NextFunction } from 'express';

/**
 * Verifies the jwt token.
 * Sets req.auth to the token payload.
 * Note: req.auth.sub will be set to the Auth0 user id.
 */
export const authenticateHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(modulename + ': running authenticateHandler');

  /* retrieves the rsa signing key */
  const secret = jwksRsa.expressJwtSecret({
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: ms('10h'),
    /* prevent attackers from sending many random */
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_CONFIG_DOMAIN}/.well-known/jwks.json`,
  });

  const checkToken = jwt({
    secret,
    audience: process.env.AUTH0_CONFIG_AUDIENCE,
    issuer: `https://${process.env.AUTH0_CONFIG_DOMAIN}/`,
    algorithm: ['RS256'],
    requestProperty: 'auth',
  });

  /* run the created middleware */
  checkToken(req, res, next);
};
