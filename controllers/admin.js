const hash = require('../helpers/hash').get_hash_code;
const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
let users_model = require('../models/users');
let plans_model = require('../models/plans');
let topics_model = require('../models/topics');
let tasks_model = require('../models/tasks');
const access_limitations = require('../helpers/configurations/access_limitations');

// View

exports.view_admin_panel = async (req, res, next) => {
    try {
        let cat_name = requests_handler.optional_param(req, "route", "category_name");
        let legal_cat_names = ["index", "users-management", "plans-management", "topics-management", "tasks-management"];
        if (!legal_cat_names.includes(cat_name)) {
            return res.redirect("/404");
        }

        res.render("pages/admin_panel", {
            access_level: req.session.user ? req.session.user.role : 1,
            is_logged_in: !!req.session.user,
            username: req.session.user && req.session.user.username,
            min_access_required: access_limitations.min_access_required,
            category_name: cat_name
        });
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

async function standard_management_params_to_render(req, cat_name, route_param_name, async_validation_func) {
    let render_extra_param_name = route_param_name + "_for_details";
    let render_params = {
        access_level: req.session.user ? req.session.user.role : 1,
        is_logged_in: !!req.session.user,
        username: req.session.user && req.session.user.username,
        min_access_required: access_limitations.min_access_required,
        category_name: cat_name
    };

    let param = requests_handler.optional_param(req, "route", route_param_name);

    if (param) {
        let async_validation_func_param = { query: {} };
        async_validation_func_param.query[route_param_name] = param;
        let param_validation_result = await async_validation_func(async_validation_func_param);
        if (!param_validation_result) {
            param = undefined;
        }
        render_params.action = "view";
        render_params[render_extra_param_name] = param;
    } else {
        render_params.action = "create";
    }
    return render_params;
}

exports.view_user_management_panel = async (req, res, next) => {
    try {
        let cat_name = "users-management";
        let route_param_name = "username";
        let render_params = await standard_management_params_to_render(req, cat_name, route_param_name, users_model.is_username_exists);
        res.render("pages/admin_panel", render_params);
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.view_plans_management_page = async (req, res, next) => {
    try {
        let cat_name = "plans-management";
        let route_param_name = "plan_name";
        let render_params = await standard_management_params_to_render(req, cat_name, route_param_name, plans_model.is_plan_exists);
        res.render("pages/admin_panel", render_params);
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.view_topics_management_page = async (req, res, next) => {
    try {
        let cat_name = "topics-management";
        let route_param_name = "topic_name";
        let render_params = await standard_management_params_to_render(req, cat_name, route_param_name, topics_model.is_topic_exists);
        res.render("pages/admin_panel", render_params);
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.view_tasks_management_page = async (req, res, next) => {
    try {
        let cat_name = "tasks-management";
        let route_param_name = "task_id";
        //let render_params = await standard_management_params_to_render(req, cat_name, route_param_name, tasks_model.is_task_exists); // TODO uncomment this line
        res.render("pages/admin_panel", render_params);
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};