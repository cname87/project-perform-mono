/**
 * This module creates a users pseudo database and manages all user-related functions.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* import the user class and the users */
import { User, users } from './configUsers';

/* application users pseudo database */
class Users {
  /**
   * Returns a user based on a supplied unique id or returns null if a matching user is not found.
   */
  getUser = (id: string) => {
    debug(modulename + ': running findUser');

    for (const user of this._users) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  };

  /* creates the users object from env parameters */
  constructor(private _users: User[]) {}
}

/* export the users findUser function */
export const getUser = new Users(users).getUser;
