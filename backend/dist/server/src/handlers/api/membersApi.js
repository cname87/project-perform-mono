"use strict";
/*
 * Handles http calls routed through the api router.
 * Handles calls to <api-prefix>/members
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
exports.addMember = (context, req, res, next) => {
    debug(modulename + ': running addMember');
    if (!(context && context.request && context.request.body)) {
        const err = {
            name: 'UNEXPECTED_FAIL',
            message: 'context not supplied',
            statusCode: 500,
            dumped: false,
        };
        req.app.appLocals.dumpError(err);
        return next(err);
    }
    const memberNoId = context.request.body;
    const config = req.app.appLocals.config;
    const handles = req.app.appLocals.miscHandlers;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    config.membersHandlers
        .addMember(req, memberNoId)
        .then((payload) => {
        handles.writeJson(context, req, res, next, 201, payload);
    })
        .catch((err) => {
        logger.error(modulename + ': handler addMember returned error');
        dumpError(err);
        next(err);
    });
};
exports.getMember = (context, req, res, next) => {
    debug(modulename + ': running getMember');
    if (!(context && context.request && context.request.params)) {
        const err = {
            name: 'UNEXPECTED_FAIL',
            message: 'context not supplied',
            statusCode: 500,
            dumped: false,
        };
        req.app.appLocals.dumpError(err);
        return next(err);
    }
    const idString = context.request.params.id;
    const id = Number.parseInt(idString, 10);
    const config = req.app.appLocals.config;
    const handles = req.app.appLocals.miscHandlers;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    config.membersHandlers
        .getMember(req, id)
        .then((payload) => {
        handles.writeJson(context, req, res, next, 200, payload);
    })
        .catch((err) => {
        logger.error(modulename + ': handler getMember returned error');
        dumpError(err);
        next(err);
    });
};
exports.getMembers = (context, req, res, next) => {
    debug(modulename + ': running getMembers');
    let name = '';
    if (context && context.request && context.request.query) {
        name = context.request.query.name;
    }
    const config = req.app.appLocals.config;
    const handles = req.app.appLocals.miscHandlers;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    config.membersHandlers
        .getMembers(req, name)
        .then((payload) => {
        handles.writeJson(context, req, res, next, 200, payload);
    })
        .catch((err) => {
        logger.error(modulename + ': handler getMembers returned error');
        dumpError(err);
        next(err);
    });
};
exports.updateMember = (context, req, res, next) => {
    debug(modulename + ': running updateMember');
    if (!(context && context.request && context.request.body)) {
        const err = {
            name: 'UNEXPECTED_FAIL',
            message: 'context not supplied',
            statusCode: 500,
            dumped: false,
        };
        req.app.appLocals.dumpError(err);
        return next(err);
    }
    const member = context.request.body;
    const config = req.app.appLocals.config;
    const handles = req.app.appLocals.miscHandlers;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    config.membersHandlers
        .updateMember(req, member)
        .then((payload) => {
        handles.writeJson(context, req, res, next, 200, payload);
    })
        .catch((err) => {
        logger.error(modulename + ': handler updateMember returned error');
        dumpError(err);
        next(err);
    });
};
exports.deleteMember = (context, req, res, next) => {
    debug(modulename + ': running deleteMember');
    if (!(context && context.request && context.request.params)) {
        const err = {
            name: 'UNEXPECTED_FAIL',
            message: 'context not supplied',
            statusCode: 500,
            dumped: false,
        };
        req.app.appLocals.dumpError(err);
        return next(err);
    }
    const idString = context.request.params.id;
    const id = Number.parseInt(idString, 10);
    const config = req.app.appLocals.config;
    const handles = req.app.appLocals.miscHandlers;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    config.membersHandlers
        .deleteMember(req, id)
        .then((number) => {
        const payload = { count: number };
        handles.writeJson(context, req, res, next, 200, payload);
    })
        .catch((err) => {
        logger.error(modulename + ': handler deleteMember returned error');
        dumpError(err);
        next(err);
    });
};
exports.deleteMembers = (context, req, res, next) => {
    debug(modulename + ': running deleteMembers');
    const config = req.app.appLocals.config;
    const handles = req.app.appLocals.miscHandlers;
    const logger = req.app.appLocals.logger;
    const dumpError = req.app.appLocals.dumpError;
    config.membersHandlers
        .deleteMembers(req)
        .then((number) => {
        const payload = { count: number };
        handles.writeJson(context, req, res, next, 200, payload);
    })
        .catch((err) => {
        logger.error(modulename + ': handler deleteMembers returned error');
        dumpError(err);
        next(err);
    });
};
exports.membersApi = {
    getMember: exports.getMember,
    getMembers: exports.getMembers,
    addMember: exports.addMember,
    deleteMember: exports.deleteMember,
    deleteMembers: exports.deleteMembers,
    updateMember: exports.updateMember,
};
//# sourceMappingURL=membersApi.js.map