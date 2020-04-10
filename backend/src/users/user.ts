/**
 * This module holds the application user definition.
 */

/**
 * User storage strategy.
 *
 * - Users are maintained on the Auth0 server, i.e. users are added, updated and deleted there.
 * - Auth0 provides a unique user id.
 * - Each user's unique id is manually maintained in the backend .env configuration parameter files.
 * - Each user has a unique email address, used to log in.
 * In addition, a unique name for the database collection associated with each user is maintained in the .env files. (This is not stored on the Auth0 server).  I use the email address as the database collection id.
 * - Each user is created in the Users module from .env parameters passed to the Users constructor below.
 * NOTE: This means that all adds, updates and deletes MUST be manually replicated in the env files, and in the Users module file.
 * - This file creates a user class with each application users' properties including unique ids and database collection name.
 * - MongoDB collections are created on the database server for each user named <'user_Db'>_members allowing each user have their own members database.
 * Note: If you change the name of a database collection associated with a user then a new empty collection is created for that user - the old collection is not deleted.but is not accessible to the client.
 * NOTE: Each user has permission to access the 'test' or 'production' database - this is maintained on the Auth0 server.  A error is thrown if a user logs in and the system is using a database to which the user does not permission.  For example, if you;re set uo to use the test database and you log in a user with access to only the production database.
 */

import { setupDebug } from '../utils/src/debugOutput';

setupDebug(__filename);

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
