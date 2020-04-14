const hash = require('../helpers/hash').get_hash_code;
const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
let plans_model = require('../models/plans');
let users_model = require('../models/users');
const access_limitations = require('../helpers/configurations/access_limitations');

// API

exports.get_plans = async (req, res, next) => {
    try {
        let plans = await plans_model.get(req, res, next);
        return responses_gen.generate_response(res, 200, plans, "Plans successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.get_plan = async (req, res, next) => {
    try {
        let plan = await plans_model.get(req, res, next);
        return responses_gen.generate_response(res, 200, plan, "Plan successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.create = async (req, res, next) => {
    try {
        let plan = await plans_model.create(req, res, next);
        return responses_gen.generate_response(res, 200, plan, "Plan successfully created");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.modify = async (req, res, next) => {
    try {
        let plan = await plans_model.modify(req, res, next);
        return responses_gen.generate_response(res, 200, plan, "Plan successfully modified");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.remove = async (req, res, next) => {
    try {
        let result = await plans_model.remove(req, res, next);
        return responses_gen.generate_response(res, 200, null, "Plan successfully removed");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

// View

exports.view_plans_page = async (req, res, next) => {
    try {
        res.render("pages/plans", {
            access_level: req.user ? req.user.role : 1,
            is_logged_in: true,
            username: req.user && req.user.username,
            min_access_required: access_limitations.min_access_required,
            plans_group: "all"
        });
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.view_plan_page = async (req, res, next) => {
    try {
        // Assumption: The user is registered to this plan
        let plan_name = requests_handler.require_param(req, "route", "plan_name");
        let data = {
            query: {
                username: req.user.username,
                plan_name: plan_name,
                user_role: req.user.role
            }
        };

        let is_plan_viewable = await users_model.is_plan_viewable_by_user(data, {}, {});

        if (is_plan_viewable) {
            let is_plan_accessible = await users_model.is_plan_accessible_by_user(data, {}, {});

            res.render("pages/view_plan", {
                access_level: req.user ? req.session.user.role : 1,
                is_logged_in: true,
                username: req.session.user && req.session.user.username,
                min_access_required: access_limitations.min_access_required,
                plan_name: plan_name,
                is_plan_accessible: is_plan_accessible
            });
        } else {
            res.redirect('/view/plans');
        }
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};