/**
 * This module creates a users pseudo database and manages all user-related functions.
 */

import { setupDebug } from '../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

import { User } from './user';

/* creates all users */
const user1 = new User(
  process.env.user1Id as string,
  process.env.user1Db as string,
);
const user2 = new User(
  process.env.user2Id as string,
  process.env.user2Db as string,
);
const userTest = new User(
  process.env.userTestId as string,
  process.env.userTestDb as string,
);
const server = new User(
  process.env.userServerId as string,
  process.env.userServerDb as string,
);

const users = [user1, user2, userTest, server];

/* application users pseudo database */
class Users {
  /**
   * Returns a user based on a supplied unique id or returns undefined if a matching user is not found.
   */
  getUser = (id: string) => {
    debug(modulename + ': running findUser');

    return this._users.find((user) => {
      return user.id === id;
    });
  };

  /* creates the users object from env parameters */
  constructor(private _users: User[]) {}
}

/* export the users findUser function */
export const getUser = new Users(users).getUser;
