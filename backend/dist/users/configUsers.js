"use strict";
/**
 * This module holds the application user definition and creates all users.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
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
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* Describes an application user */
class User {
    constructor(_id, _email) {
        this._id = _id;
        this._email = _email;
    }
    get id() {
        return this._id;
    }
    get email() {
        return this._email;
    }
}
exports.User = User;
/* creates all users */
const user1 = new User(process.env.user1Id, process.env.user1Email);
const user2 = new User(process.env.user2Id, process.env.user2Email);
exports.users = [user1, user2];
//# sourceMappingURL=configUsers.js.map