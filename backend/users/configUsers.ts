/**
 * This module holds the application user definition and creates all users.
 */

/**
 * User storage strategy.
 *
 * - Users are maintained on the Auth0 server, i.e. users are added, updated and deleted there.
 * - Auth0 provides a unique user id.
 * - Each user has a unique email address.
 * - Each user's unique id and email address are manually maintained in the backend env configuration parameter file.
 * - Each user is created from the env in the Users constructor below.
 * NOTE:  This means that all adds, updates and deletes MUST be manually replicated in the env file, and in the file below.
 * - This file creates a users object with each application users' properties including unique ids and email addresses.
 * - MongoDB collections are created on the database server for each user named <'user_email'>_members allowing each user have their own members database.  Therefore if you change a user email you must rename the corresponding server database collection.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* Describes an application user */
export class User {
  constructor(private _id: string, public _email: string) {}

  public get id(): string {
    return this._id;
  }
  public get email(): string {
    return this._email;
  }
}

/* creates all users */
const userTest = new User(
  process.env.userTestId as string,
  process.env.userTestEmail as string,
);
const user1 = new User(
  process.env.user1Id as string,
  process.env.user1Email as string,
);
const user2 = new User(
  process.env.user2Id as string,
  process.env.user2Email as string,
);

export const users = [userTest, user1, user2];
