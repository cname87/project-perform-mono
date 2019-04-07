const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/**
 * Import external dependencies.
 */
import { Document } from 'mongoose';

/**
 * Import local types
 */
import { IErr, IMember, IRequestApp } from '../configServer';

/**
 * Adds a supplied member object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param member Member to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the member object added.
 */
export const addMember = (
  req: IRequestApp,
  member: IMember,
): Promise<IMember> => {
  const modelMembers = req.app.appLocals.models.members;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  const addedMember = new modelMembers(member);
  return new Promise((resolve, reject) => {
    addedMember.save((err: Error, savedMember: Document) => {
      /* return any database access error */
      if (err) {
        /* check if failure was trying to add a duplicate */
        if (err.message.includes('duplicate')) {
          logger.error(modulename + ': addMember duplicate member found ');
          dumpError(err);
          const errDbDuplicate: IErr = {
            name: 'DATABASE_DUPLICATE',
            message: 'A member with that id already exists in the database',
            statusCode: 409,
            dumped: true,
          };
          return reject(errDbDuplicate);
        }
        logger.error(modulename + ': addMember database error');
        dumpError(err);
        const errDbUnknown: IErr = {
          name: 'DATABASE_ACCESS',
          message: 'The database service is unavailable',
          statusCode: 503,
          dumped: true,
        };
        return reject(errDbUnknown);
      }

      /* return the added member as a JSON object*/
      return resolve(savedMember.toObject());
    });
  });
};

/**
 * Returns a specific team member given by the id parameter passed in.
 * Note: The member data model has the id key set to unique so no more than 1 member can be returned.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param idParam The id of the member to return.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to a member object.
 */
export const getMember = (
  req: IRequestApp,
  idParam: number,
): Promise<IMember> => {
  debug(modulename + ': running getMember');

  const modelMembers = req.app.appLocals.models.members;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  return new Promise((resolve, reject) => {
    modelMembers.findOne({ id: idParam }, (err: Error, doc: Document) => {
      /* return any database access error */
      if (err) {
        logger.error(modulename + ': getMember database error');
        dumpError(err);
        const errDb: IErr = {
          name: 'DATABASE_ACCESS',
          message: 'The database service is unavailable',
          statusCode: 503,
          dumped: true,
        };
        return reject(errDb);
      }

      /* return error if no member found */
      if (!doc) {
        logger.error(modulename + ': getMember found no matching member');
        const errNotFound: IErr = {
          name: 'DATABASE_NOT_FOUND',
          message: 'The supplied member ID does not match a stored member',
          statusCode: 404,
          dumped: true,
        };
        return reject(errNotFound);
      }

      /* strip down to member object and return */
      return resolve(doc.toObject());
    });
  });
};

/**
 * Returns all the members in a team.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param matchString A string to match members to return.
 * - If a matchString is not supplied then all team members are returned.
 * - If a matchstring is supplied it returns all team members whose 'name' field starts with the match string (case insensitive).
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to an array of member objects.
 */
export const getMembers = (
  req: IRequestApp,
  matchString = '',
): Promise<[IMember]> => {
  debug(modulename + ': running getMembers');

  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;
  const modelMembers = req.app.appLocals.models.members;

  return new Promise((resolve, reject) => {
    modelMembers
      .find()
      .where('name')
      .regex(new RegExp(`${matchString}.*`, 'i')) //
      .lean(true) // return json object
      .select({ _id: 0, __v: 0 }) // exclude _id and __v fields
      .exec((err: Error, docs: [IMember]) => {
        /* return any database access error */
        if (err) {
          logger.error(modulename + ': getMembers database error');
          dumpError(err);
          const errDb: IErr = {
            name: 'DATABASE_ACCESS',
            message: 'The database service is unavailable',
            statusCode: 503,
            dumped: true,
          };
          return reject(errDb);
        }

        /* return error if no member found */
        if (!docs.length) {
          logger.error(modulename + ': getMembers found no matching member');
          const errNotFound: IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied match string does not match any team member',
            statusCode: 404,
            dumped: true,
          };
          return reject(errNotFound);
        }

        /* return member objects array */
        return resolve(docs);
      });
  });
};

/**
 * Deletes a specific team member given by the id parameter passed in.
 * Note: The member data model has the id key set to unique so no more than 1 member can be deleted.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param idParam The id of the member to delete.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the deleted member object.
 */
export const deleteMember = (
  req: IRequestApp,
  idParam: number,
): Promise<undefined> => {
  debug(modulename + ': running deleteMember');

  const modelMembers = req.app.appLocals.models.members;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  return new Promise((resolve, reject) => {
    modelMembers.deleteOne({ id: idParam }).exec((err: Error, result) => {
      /* return any database access error */
      if (err) {
        logger.error(modulename + ': deleteMember database error');
        dumpError(err);
        const errDb: IErr = {
          name: 'DATABASE_ACCESS',
          message: 'The database service is unavailable',
          statusCode: 503,
          dumped: true,
        };
        return reject(errDb);
      }

      /* return error if no member deleted */
      if (result.n === 0) {
        logger.error(modulename + ': delete Member found no matching member');
        const errNotFound: IErr = {
          name: 'DATABASE_NOT_FOUND',
          message: 'The supplied member ID does not match a stored member',
          statusCode: 404,
          dumped: true,
        };
        return reject(errNotFound);
      }

      /* return undefined to match api */
      return resolve();
    });
  });
};

/**
 * Adds a supplied member object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param member Member to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the member object added.
 */
export const updateMember = (
  req: IRequestApp,
  member: IMember,
): Promise<IMember> => {
  const modelMembers = req.app.appLocals.models.members;
  const logger = req.app.appLocals.logger;
  const dumpError = req.app.appLocals.dumpError;

  const updatedMember = new modelMembers(member);

  return new Promise((resolve, reject) => {
    modelMembers.findOneAndUpdate(
      { id: member.id },
      updatedMember,
      { new: true, runValidators: true },
      (err: Error, doc: Document | null) => {
        /* return any database access error */
        if (err) {
          logger.error(modulename + ': updateMember database error');
          dumpError(err);
          const errDb: IErr = {
            name: 'DATABASE_ACCESS',
            message: 'The database service is unavailable',
            statusCode: 503,
            dumped: true,
          };
          return reject(errDb);
        }

        /* return error if no member found */
        if (!doc) {
          logger.error(modulename + ': updateMember found no matching member');
          const errNotFound: IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied member id does not match any team member',
            statusCode: 404,
            dumped: true,
          };
          return reject(errNotFound);
        }

        /* return new member object */
        resolve(doc.toObject());
      },
    );
  });
};
