"use strict";
/**
 * This module creates a users pseudo database and manages all user-related functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* import the user class and the users */
const configUsers_1 = require("./configUsers");
/* application users pseudo database */
class Users {
    /* creates the users object from env parameters */
    constructor(_users) {
        this._users = _users;
        /**
         * Returns a user based on a supplied unique id or returns null if a matching user is not found.
         */
        this.getUser = (id) => {
            debug(modulename + ': running findUser');
            for (const user of this._users) {
                if (user.id === id) {
                    return user;
                }
            }
            return null;
        };
    }
}
/* export the findUser function */
exports.getUser = new Users(configUsers_1.users).getUser;
//# sourceMappingURL=users.js.map