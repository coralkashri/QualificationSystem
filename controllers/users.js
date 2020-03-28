const hash = require('../helpers/hash').get_hash_code;
const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
let users_model = require('../models/users');
const access_limitations = require('../helpers/configurations/access_limitations');

exports.get_users = async (req, res, next) => {
    try {
        let users = await users_model.get(req, res, next); // all
        return responses_gen.generate_response(res, 200, users, "Users successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.get_user = async (req, res, next) => {
    try {
        let user = await users_model.get(req, res, next); // by id
        return responses_gen.generate_response(res, 200, user, "User successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.add_user = async (req, res, next) => {
    try {
        let user = await users_model.add(req, res, next);
        return responses_gen.generate_response(res, 200, user, "User successfully created");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.modify_user = async (req, res, next) => {
    try {
        let user = await users_model.modify(req, res, next);
        return responses_gen.generate_response(res, 200, user, "User successfully modified");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.remove_user = async (req, res, next) => {
    try {
        let user = await users_model.remove(req, res, next);
        return responses_gen.generate_response(res, 200, user, "User successfully deleted");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};


// View

exports.view_profile = async (req, res, next) => {
    try {
        res.render("pages/profile", {
            access_level: req.session.user ? req.session.user.role : 1,
            is_logged_in: !!req.session.user,
            username: req.session.user && req.session.user.username,
            min_access_required: access_limitations.min_access_required
        });
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};