/**
 * This module holds the application user definition and creates all users.
 */

/**
 * User storage strategy.
 *
 * - Users are maintained on the Auth0 server, i.e. users are added, updated and deleted there.
 * - Auth0 provides a unique user id.
 * - Each user has a unique email address.
 * - Each user's unique id is manually maintained in the backend env configuration parameter file.
 * In addition a unique name for the database collection associated with each user is maintained in the .env file.  (This is not stored on the Auth0 server).
 * - Each user is created from the env in the Users constructor below.
 * NOTE:  This means that all adds, updates and deletes MUST be manually replicated in the env file, and in the file below.
 * - This file creates a users object with each application users' properties including unique ids and database collection name.
 * - MongoDB collections are created on the database server for each user named <'user_Db'>_members allowing each user have their own members database.
 * Note: If you change the name of a database collection associated with a user then a new empty collection is created for that user - the old collection is not deleted.but is not accessible to the client.
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* Describes an application user */
export class User {
  constructor(private _id: string, public _dbCollection: string) {}

  public get id(): string {
    return this._id;
  }
  public get dbCollection(): string {
    return this._dbCollection;
  }
}

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

export const users = [user1, user2, userTest, server];
