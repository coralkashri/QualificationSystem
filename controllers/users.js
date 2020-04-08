const hash = require('../helpers/hash').get_hash_code;
const assert = require('assert');
const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
let users_model = require('../models/users');
let plans_model = require('../models/plans');
const access_limitations = require('../helpers/configurations/access_limitations');

// Value extract / calculate functions

let is_user_registered_to_plan = async (username, plan_name) => {
    let req = {query: {}};
    req.query.username = username;
    req.query.plan_name = plan_name;
    return await users_model.is_user_registered_to_plan(req, {}, {});
};

exports.is_user_registered_to_plan = is_user_registered_to_plan;

let is_plan_accessible_by_user = async (username, plan_name, user_role) => {
    let req = {query: {}};
    req.query.username = username;
    req.query.plan_name = plan_name;
    req.query.user_role = user_role;
    return await users_model.is_plan_accessible_by_user(req);
};

exports.is_plan_accessible_by_user = is_plan_accessible_by_user;

let is_plan_viewable_by_user = async (username, plan_name, user_role) => {
    let req = {query: {}};
    req.query.username = username;
    req.query.plan_name = plan_name;
    req.query.user_role = user_role;
    return await users_model.is_plan_viewable_by_user(req);
};

exports.is_plan_viewable_by_user = is_plan_viewable_by_user;

let is_plan_registrable_by_user = async (username, plan_name, user_role) => {
    let req = {query: {}};
    req.query.username = username;
    req.query.plan_name = plan_name;
    req.query.user_role = user_role;
    return await users_model.is_plan_registrable_by_user(req);
};

exports.is_plan_registrable_by_user = is_plan_registrable_by_user;


// Routing functions

exports.get_available_plans = async (req, res, next) => {
    try {
        assert.ok(!!req.session.user, "User disconnected, please login.");
        let plans = await plans_model.get(req, res, next);
        let username =  req.session.user.username;

        // Update for each plan if the user already registered to it
        for (let i = 0; i < plans.length; i++) {
            plans[i]._doc.is_registered = await is_user_registered_to_plan(username, plans[i].name);
        }
        return responses_gen.generate_response(res, 200, plans, "Plans successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.get_registered_plans = async (req, res, next) => {
    try {
        assert.ok(!!req.session.user, "User disconnected, please login.");
        let user_details = await users_model.get(req, res, next);
        let plans = user_details[0].plans;

        // Update plans details
        for (let i = 0; i < plans.length; i++) {
            req.query.plan_id = plans[i].id;
            let details = await plans_model.get_plan_details_by_id(req, res, next);
            plans[i]._doc.name = details.name;
            plans[i]._doc.description = details.description;
            plans[i]._doc.estimated_days = details.estimated_days;
            plans[i]._doc.is_active = details.is_active;
            plans[i]._doc.is_registered = true;
        }

        return responses_gen.generate_response(res, 200, plans, "Plans successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

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

exports.register_to_plan = async (req, res, next) => {
    try {
        let user = await users_model.add_plan(req, res, next);
        return responses_gen.generate_response(res, 200, user, "User successfully registered to plan");
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
        let render_params = await users_model.get_profile_render_params(req, res, next);
        res.render("pages/profile", render_params);
    } catch (e) {
        res.render("errors/general_error", {
            error_msg: e.message
        });
    }
};

// View all plans that the user is register to
exports.view_user_active_plans_page = async (req, res, next) => {
    try {
        let username = requests_handler.require_param(req, "route", "username");
        if (username !== req.user.username && req.user.role < access_limitations.min_access_required.view_users_details)
            throw new Error("You have no permission to watch this user.");

        res.render("pages/plans", {
            access_level: req.user.role,
            is_logged_in: true,
            username: req.user.username,
            min_access_required: access_limitations.min_access_required,
            plans_group: "registered",
            view_user: username
        });
    } catch (e) {
        res.render("errors/general_error", {
            error_msg: e.message
        });
    }
};