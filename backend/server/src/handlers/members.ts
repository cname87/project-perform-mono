const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import { Request } from 'express';
import { Document, Model } from 'mongoose';
import * as winston from 'winston';

interface IMember {
  name: string;
  id: number;
}

/**
 * Adds a supplied member to the team
 *
 * @param database database
 * @param member Member to add
 * @returns the member added
 */
export const addMember = async (modelMembers: any, member: IMember) => {
  /* *** to do: check id is unique */

  const addedMember = new modelMembers(member);
  await addedMember.save();
  return addedMember;
};

/**
 * Returns a specific team member given by the id parameter passed in.
 * Note: The member data model has the id key set to unique so no more than 1 member can be returned.
 * @param req The htt request being actioned (used to retrieve the data model)
 * @param idParam The id of the member to return
 * @returns Promise that resolves to a Member object
 */
export const getMember = (req: Request, idParam: number): Promise<IMember> => {
  debug(modulename + ': running getMember');

  const logger: winston.Logger = req.app.locals.logger;
  const dumpError = req.app.locals.dumpError;
  const modelMembers: Model<Document> = req.app.locals.models.members;

  return new Promise((resolve, reject) => {
    modelMembers.findOne({ id: idParam }, (err: Error, doc: Document) => {
      /* return any database access error */
      if (err) {
        logger.error(modulename + ': getMember database error');
        dumpError(err);
        const errDb = {
          message: 'The database service is unavailable',
          statusCode: 503,
        };
        return reject(errDb);
      }

      /* return error if no member found */
      if (!doc) {
        logger.error(modulename + ': getMember found no matching member');
        const errNotFound = {
          message: 'The supplied member ID does not match a stored member',
          statusCode: 404,
        };
        return reject(errNotFound);
      }

      /* strip down to member object and return */
      return resolve(doc.toObject());
    });
  });
};

/**
 * Returns the members of a team
 * Returns all team members
 *
 * name String Pass an optional name search string to limit the returned list (optional)
 * returns List
 */
export const getMembers = (_name: string) => {
  return new Promise((resolve, _reject) => {
    const examples: any = {};
    examples['application/json'] = [
      {
        name: 'Team Member',
        id: 5,
      },
      {
        name: 'Team Member',
        id: 5,
      },
    ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
};

/**
 * Deletes a member from a team
 * Deletes a member from the team
 *
 * id Integer The ID of the team member to delete
 * no response value expected for this operation
 */
export const deleteMember = (_id: number) => {
  return new Promise((resolve, _reject) => {
    resolve();
  });
};

/**
 * Updates a member in a team
 * Updates the data on a member of the team
 *
 * id Integer The ID of the team member to update
 * member Member Member to update (optional)
 * no response value expected for this operation
 */
export const updateMember = (_id: number, _member: any) => {
  return new Promise((resolve, _reject) => {
    resolve();
  });
};
