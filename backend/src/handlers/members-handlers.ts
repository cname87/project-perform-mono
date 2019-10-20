/**
 * Holds all members handlers e.g. getMember.
 */

import { setupDebug } from '../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

/**
 * Import external dependencies.
 */
import { Document } from 'mongoose';
import { Request } from 'express';

/* shared function to report unknown database error */
const databaseUnavailable = (
  err: any,
  caller: string,
  locals: Perform.IAppLocals,
  reject: (reason: any) => void,
) => {
  locals.logger.error(modulename + ': ' + caller + ' database error reported');
  locals.dumpError(err);
  const errDb: Perform.IErr = {
    name: 'DATABASE_ACCESS',
    message: 'The database service is unavailable',
    statusCode: 503,
    dumped: true,
  };
  return reject(errDb);
};

/**
 * Adds a supplied member object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param memberNoId Member to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the member object added.
 */
const addMember = (
  req: Request,
  memberNoId: Perform.IMemberNoId,
): Promise<Perform.IMember> => {
  const modelMembers = req.app.appLocals.models.members;

  /* test that the supplied member does not already have an id */
  if (memberNoId.id) {
    const err: Perform.IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'member id exists before document creation',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    throw new Error('member id exists before document creation');
  }

  const addedMember = new modelMembers(memberNoId);
  return new Promise((resolve, reject) => {
    addedMember
      .save()
      .then((savedMember: Document) => {
        /* return the added member as a JSON object*/
        return resolve(savedMember.toObject());
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'addMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
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
const getMember = (req: Request, idParam: number): Promise<Perform.IMember> => {
  debug(modulename + ': running getMember');

  const modelMembers = req.app.appLocals.models.members;
  const logger = req.app.appLocals.logger;

  return new Promise((resolve, reject) => {
    modelMembers
      .findOne({ id: idParam })
      .exec()
      .then((doc) => {
        /* return error if no member found */
        if (!doc) {
          logger.error(modulename + ': getMember found no matching member');
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied member ID does not match a stored member',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* strip down to member object and return */
        return resolve(doc.toObject());
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
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
const getMembers = (
  req: Request,
  matchString = '',
): Promise<[Perform.IMember]> => {
  debug(modulename + ': running getMembers');

  const modelMembers = req.app.appLocals.models.members;

  /* replace all characters, 'c', in the user entered search string that need to be escaped in a regex pattern with '\c' */
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  const sanitizedMatchString = escapeRegExp(matchString);

  return new Promise((resolve, reject) => {
    modelMembers
      .find()
      .where('name')
      .regex('name', new RegExp(`^${sanitizedMatchString}.*`, 'i'))
      .lean(true) // return json object
      .select({ _id: 0, __v: 0 }) // exclude _id and __v fields
      .exec()
      .then((docs) => {
        /* return member objects array */
        return resolve(docs as [Perform.IMember]);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getMembers';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
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
const updateMember = (
  req: Request,
  member: Perform.IMember,
): Promise<Perform.IMember> => {
  const modelMembers = req.app.appLocals.models.members;
  const logger = req.app.appLocals.logger;

  const updatedMember = new modelMembers(member);

  return new Promise((resolve, reject) => {
    modelMembers
      .findOneAndUpdate({ id: member.id }, updatedMember, {
        new: true,
        runValidators: true,
      })
      .exec()
      .then((doc) => {
        /* return error if no member found */
        if (!doc) {
          logger.error(modulename + ': updateMember found no matching member');
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied member ID does not match a stored member',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return new member object */
        resolve(doc.toObject());
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'updateMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
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
const deleteMember = (req: Request, idParam: number): Promise<number> => {
  debug(modulename + ': running deleteMember');

  const modelMembers = req.app.appLocals.models.members;
  const logger = req.app.appLocals.logger;

  return new Promise((resolve, reject) => {
    modelMembers
      .deleteOne({ id: idParam })
      .exec()
      .then((doc) => {
        /* return error if no member deleted */
        if (doc.n === 0) {
          logger.error(modulename + ': delete Member found no matching member');
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied member ID does not match a stored member',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return count (= 1) to match api */
        return resolve(doc.n);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'deleteMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Deletes all the members in a team.
 * Resets the autoincrement id function so the next member created will have an id of 1.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param matchString A string to match members to return.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to undefined.
 */
const deleteMembers = (req: Request): Promise<number> => {
  debug(modulename + ': running deleteMembers');

  const modelMembers = req.app.appLocals.models.members;

  return new Promise((resolve, reject) => {
    modelMembers
      .deleteMany({})
      .exec()
      .then((docs) => {
        /* reset id autoincrement count to 1 */
        modelMembers.resetCount();
        /* return number of members deleted */
        return resolve(docs.n);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'deleteMembers';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

export const membersHandlers = {
  addMember,
  getMember,
  getMembers,
  updateMember,
  deleteMember,
  deleteMembers,
};
