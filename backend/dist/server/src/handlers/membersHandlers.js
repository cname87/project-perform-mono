"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* shared function to report unknown database error */
const databaseUnavailable = (err, caller, logger, dumpError, reject) => {
    logger.error(modulename + ': ' + caller + ' database error reported');
    dumpError(err);
    const errDb = {
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
exports.addMember = (req, memberNoId) => {
    const modelMembers = req.app.appLocals.models.members;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    /* test that the supplied member does not already have an id */
    if (memberNoId.id) {
        const err = {
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
            .then((savedMember) => {
            /* return the added member as a JSON object*/
            return resolve(savedMember.toObject());
        })
            .catch((err) => {
            /* report a general database unavailable error */
            const functionName = 'addMember';
            databaseUnavailable(err, functionName, logger, dumpError, reject);
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
exports.getMember = (req, idParam) => {
    debug(modulename + ': running getMember');
    const modelMembers = req.app.appLocals.models.members;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    return new Promise((resolve, reject) => {
        modelMembers
            .findOne({ id: idParam })
            .exec()
            .then((doc) => {
            /* return error if no member found */
            if (!doc) {
                logger.error(modulename + ': getMember found no matching member');
                const errNotFound = {
                    name: 'DATABASE_NOT_FOUND',
                    message: 'The supplied member ID does not match a stored member',
                    statusCode: 404,
                    dumped: true,
                };
                return reject(errNotFound);
            }
            /* strip down to member object and return */
            return resolve(doc.toObject());
        })
            .catch((err) => {
            /* report a general database unavailable error */
            const functionName = 'getMember';
            databaseUnavailable(err, functionName, logger, dumpError, reject);
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
exports.getMembers = (req, matchString = '') => {
    debug(modulename + ': running getMembers');
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    const modelMembers = req.app.appLocals.models.members;
    return new Promise((resolve, reject) => {
        modelMembers
            .find()
            .where('name')
            .regex('name', new RegExp(`^${matchString}.*`, 'i'))
            .lean(true) // return json object
            .select({ _id: 0, __v: 0 }) // exclude _id and __v fields
            .exec()
            .then((docs) => {
            /* return member objects array */
            return resolve(docs);
        })
            .catch((err) => {
            /* report a general database unavailable error */
            const functionName = 'getMembers';
            databaseUnavailable(err, functionName, logger, dumpError, reject);
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
exports.updateMember = (req, member) => {
    const modelMembers = req.app.appLocals.models.members;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
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
                const errNotFound = {
                    name: 'DATABASE_NOT_FOUND',
                    message: 'The supplied member ID does not match a stored member',
                    statusCode: 404,
                    dumped: true,
                };
                return reject(errNotFound);
            }
            /* return new member object */
            resolve(doc.toObject());
        })
            .catch((err) => {
            /* report a general database unavailable error */
            const functionName = 'updateMember';
            databaseUnavailable(err, functionName, logger, dumpError, reject);
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
exports.deleteMember = (req, idParam) => {
    debug(modulename + ': running deleteMember');
    const modelMembers = req.app.appLocals.models.members;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    return new Promise((resolve, reject) => {
        modelMembers
            .deleteOne({ id: idParam })
            .exec()
            .then((doc) => {
            /* return error if no member deleted */
            if (doc.n === 0) {
                logger.error(modulename + ': delete Member found no matching member');
                const errNotFound = {
                    name: 'DATABASE_NOT_FOUND',
                    message: 'The supplied member ID does not match a stored member',
                    statusCode: 404,
                    dumped: true,
                };
                return reject(errNotFound);
            }
            /* return count (= 1) to match api */
            return resolve(doc.n);
        })
            .catch((err) => {
            /* report a general database unavailable error */
            const functionName = 'deleteMember';
            databaseUnavailable(err, functionName, logger, dumpError, reject);
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
exports.deleteMembers = (req) => {
    debug(modulename + ': running deleteMembers');
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
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
            databaseUnavailable(err, functionName, logger, dumpError, reject);
        });
    });
};
//# sourceMappingURL=membersHandlers.js.map