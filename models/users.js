const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
const access_limitations = require('../helpers/configurations/access_limitations');
let plans_model = require('./plans');

// Value extract / calculate functions

/**
 * @description The function validate that the modify or deletion won't cause the lost of admin permission in the system.
 * False - Role modification / User deletion is allowed.
 * True - Don't modify the role, and don't delete this last admin user.
 *
 * @param username - The user name to apply the action on.
 * @param action - ["Delete", "Update"].
 * @param new_role - In case of "Update" action, the new target role.
 *
 * @note This function doesn't check for user existence.
 *
 * @returns true / false
 */
let last_admin_user_validation = async (username, action, new_role) => {
    let ans = false;
    let admin_role_number = access_limitations.roles.admin;
    if (action.toLowerCase() === "delete" || Number(new_role) !== admin_role_number) { // Not admin
        let users_db_model = database.users_model();
        let query, res;

        // Check target user role.
        query = {
            username: username
        };
        res = await users_db_model.find(query, 'role').exec();
        if (res[0]._doc.role === admin_role_number) { // If target user role is admin
            query = {
                role: admin_role_number
            };
            res = await users_db_model.find(query, 'username').exec();
            if (res.length === 1) { // This is the last admin in the system
                ans = true;
            }
        }
    }
    return ans;
};

/**
 * @param req
 * req["query"]["username"]
 *
 * @returns true if exists, else false
 */
let is_username_exists = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.require_param(req, "get", "username");
    return (await users_db_model.find({username: username}).exec()).length !== 0;
};

exports.is_username_exists = is_username_exists;

/**
 * @param req
 * req["query"]["username"]
 *
 * @returns user role number
 */
let get_user_role = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.require_param(req, "get", "username");
    return (await users_db_model.find({username: username}, "role").exec())[0].role;
};

/**
 * @param req
 * (require) req["query"]["plan_name"]
 * (require) req["query"]["username"]
 * (optional) req["query"]["user_role"]
 *
 * @returns true if exists, else false
 */
let is_plan_accessible_by_user = async (req, res, next) => {
    let access_allow_flag;
    let access_forbid_flag = false;

    let role = requests_handler.optional_param(req, "get", "user_role");

    let is_user_exists = await is_username_exists(req, res, next);
    assert.ok(is_user_exists, "Username not exists.");
    let is_plan_exists = await plans_model.is_plan_exists(req, res, next);
    assert.ok(is_plan_exists, "Plan not found.");

    if (!role) {
        role = await get_user_role(req, res, next);
    }

    let is_plan_archived = await plans_model.is_plan_archived(req, res, next);

    if (is_plan_archived) {
        access_forbid_flag = role < access_limitations.min_access_required.view_archived_plans; // Does user *don't* have a permission to view archived plans
    }

    access_allow_flag = role >= access_limitations.min_access_required.watch_unregistered_plans; // Watch access
    if (!access_forbid_flag && !access_allow_flag) {
        access_allow_flag = await is_user_registered_to_plan(req, {}, {}); // Is registered
    }

    return !access_forbid_flag && access_allow_flag;
};

exports.is_plan_accessible_by_user = is_plan_accessible_by_user;

/**
 * @param req
 * (require) req["query"]["plan_name"]
 * (require) req["query"]["username"]
 * (optional) req["query"]["user_role"]
 *
 * @returns true if exists, else false
 */
let is_plan_viewable_by_user = async (req, res, next) => {
    let role = requests_handler.optional_param(req, "get", "user_role");

    let is_user_exists = await is_username_exists(req, res, next);
    assert.ok(is_user_exists, "Username not exists.");
    let is_plan_exists = await plans_model.is_plan_exists(req, res, next);
    assert.ok(is_plan_exists, "Plan not found.");

    if (!role) {
        role = await get_user_role(req, res, next);
    }

    let is_plan_active = !(await plans_model.is_plan_archived(req, res, next));
    let is_registered = await is_user_registered_to_plan(req, {}, {});
    let is_watch_access = role >= access_limitations.min_access_required.watch_unregistered_plans;
    let is_inactive_access = role >= access_limitations.min_access_required.view_archived_plans;

    return is_registered || is_watch_access && (is_plan_active || is_inactive_access);
};

exports.is_plan_viewable_by_user = is_plan_viewable_by_user;

let is_plan_registrable_by_user = async (req, res, next) => {
    let role = requests_handler.optional_param(req, "get", "user_role");

    let is_user_exists = await is_username_exists(req, res, next);
    assert.ok(is_user_exists, "Username not exists.");
    let is_plan_exists = await plans_model.is_plan_exists(req, res, next);
    assert.ok(is_plan_exists, "Plan not found.");

    if (!role) {
        role = await get_user_role(req, res, next);
    }

    let is_plan_active = !(await plans_model.is_plan_archived(req, res, next));
    let is_registered = await is_user_registered_to_plan(req, {}, {});
    let is_inactive_access = role >= access_limitations.min_access_required.view_archived_plans;

    return !is_registered && (is_plan_active || is_inactive_access);
};

exports.is_plan_registrable_by_user = is_plan_registrable_by_user;

/**
 * @param req
 * req["query"]["username"] - Target user
 * req["query"]["plan_name"] - Check for plan
 *
 * @returns true if user is already registered to this plan, else false.
 */
let is_user_registered_to_plan = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username =  requests_handler.require_param(req, "get", "username");
    let plan_name = requests_handler.require_param(req, "get", "plan_name");
    let is_register;
    try {
        let query = {
            username: username,
            "plans.id": await plans_model.get_plan_id({query: {plan_name}})
        };
        let query_res = await users_db_model.find(query).exec();
        is_register = query_res.length > 0;
    } catch (e) {
        is_register = false;
    }
    return is_register;
};

exports.is_user_registered_to_plan = is_user_registered_to_plan;


// API

exports.get = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Extract param
    let username = requests_handler.optional_param(req, "route", "username");

    // Validation
    if (req.user && req.user.role < access_limitations.min_access_required.view_users_details && req.user.username !== username) {
        throw new Error("You have no permission to watch this user.");
    }

    /* Assumptions here:
    *   1. The user might be logged in OR logged out.
    *
    *   2. If the user is logged in:
    *   2.1. The user have an access to view all the users.
    *   2.2. The user requested to view his self profile.
    * */

    // Arrange data
    let query = {};
    if (username) { // Get specific user by id
        query.username = username;
        if (!req.user) { // [For login / self profile view actions] If not logged in already OR the current user is not an admin, require password
            let password = requests_handler.require_param(req, "get", "password");
            query.password = hash(password);
        }
    } else { /* Get all users */ }

    // Perform action
    return users_db_model.find(query, '-password').exec();
};

exports.add = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Extract params
    let username = requests_handler.require_param(req, "post", "username");
    let password = requests_handler.require_param(req, "post", "password");
    let role = requests_handler.optional_param(req, "post", "role");

    // Validation
    let user_exists = await is_username_exists({ query: { username: username } });

    assert.ok(!user_exists, "User already exists"); // If exists, throw error

    // Arrange new data
    let data = {
        username: username,
        password: hash(password),
    };

    if (req.user && req.user.role >= access_limitations.min_access_required.create_new_user_with_specific_role && role) {
        data.role = role;
    }

    // Perform action
    let new_user = new users_db_model(data);
    new_user = await new_user.save();

    return new_user;
};

exports.modify = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Get main param
    let username = requests_handler.require_param(req, "route", "username");
    let current_password;

    assert.ok(!!req.session.user, "User disconnected, please login.");

    // Get params
    if (req.session.user.role <= access_limitations.min_access_required.modify_all_users) {
        current_password = requests_handler.require_param(req, "post", "current_password");
    }
    let new_username = requests_handler.optional_param(req, "post", "username");
    let new_password = requests_handler.optional_param(req, "post", "password");
    let new_role = requests_handler.optional_param(req, "post", "role");

    // Pre Validations
    // TODO Add a password validation for the current logged in user -- Even for administrator, to make sure that he is the one that send the request.

    assert.ok(await is_username_exists({ query: {username} }), "User not found"); // If not exists, throw error

    let last_admin_validation = await last_admin_user_validation(username, "Modify", new_role);
    assert.ok(!last_admin_validation, "Attention! This is the last admin user. You can't modify it's role or you won't be able to access as admin anymore."); // If last admin will be lost, throw error

    // Arrange new data
    let update_struct = {};
    requests_handler.validate_and_set_basic_optional_input(new_username, update_struct, "username");
    requests_handler.validate_and_set_basic_optional_input(new_password, update_struct, "password");
    requests_handler.validate_and_set_basic_optional_input(new_role, update_struct, "role");

    // Prepare query
    let filter = {username: username};
    let update = { $set: update_struct };
    if (current_password) {
        filter.password = hash(current_password);
        delete update.$set.role;
    }

    // Perform action
    let new_user = await users_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();

    // Post Validation
    assert.equal(new_user.ok, true, "Target user update failed.");

    return new_user;
};

/**
 * @param req
 * req["params"]["username"] - Target user
 * req["params"]["plan_name"] - Target plan
 */
exports.add_plan = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Get main param
    let username = requests_handler.require_param(req, "route", "username");

    // Set params for future queries
    req.query.username = username;
    req.query.plan_name = req.params.plan_name;

    // Get optional params
    let role = requests_handler.optional_param(req, "get", "user_role");

    if (!role) {
        role = await get_user_role(req, res, next);
        req.query.role = role;
    }

    // Validation
    assert.ok(await is_plan_registrable_by_user(req, res, next), "Can't register this user to this plan.");

    if (role < access_limitations.min_access_required.register_other_users_to_plans) {
        assert(req.user.username === username, "You don't have a permission to register other users to plans.");
    }

    // Extract required details
    let plan_id = await plans_model.get_plan_id(req);
    let first_task_id = await plans_model.get_plan_next_mission_id(req);
    first_task_id = "a";
    // Prepare query
    let filter = {username: username};
    let update = {
        $push: {
            plans: {
                id: plan_id,
                current_task: {
                    id: first_task_id
                }
            }
        }
    };

    // Perform action
    let new_user = await users_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();

    // Post Validation
    assert.equal(new_user.ok, true, "Plan addition to user failed.");

    return new_user;
};

exports.remove = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Get main param
    let username = requests_handler.require_param(req, "route", "username");

    // Validations
    assert.ok(await is_username_exists({ query: { username: username} }), "User not found"); // If not exists, throw error

    let last_admin_validation = await last_admin_user_validation(username, "Delete");
    assert.ok(!last_admin_validation, "Attention! This is the last admin user. You can't delete this user or you won't be able to access as admin anymore."); // If last admin will be lost, throw error

    // Perform action
    return users_db_model.remove({username: username}).exec();
};


// View

exports.get_profile_render_params = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();
    let render_params = {
        access_level: req.session.user.role,
        is_logged_in: true,
        username: req.session.user.username,
        min_access_required: access_limitations.min_access_required,
        view_details: {}
    };

    // Get main param
    let username = requests_handler.require_param(req, "route", "username");

    if (username === req.session.user.username) {
        render_params.view_details.username = req.session.user.username;
        render_params.view_details.role = req.session.user.role;
        render_params.view_details.register_date = req.session.user.register_date;
    } else {
        // Validations
        if (req.session.user.role < access_limitations.min_access_required.view_users_details)
            throw new Error("You have no permission to watch this user.");

        assert.ok(await is_username_exists({ query: { username: username } }), "User not found"); // If not exists, throw error

        let user_details = await users_db_model.find({username: username}, ["role", "register_date"]).exec();
        render_params.view_details.username = username;
        render_params.view_details.role = users_db_model[0].role;
        render_params.view_details.register_date = users_db_model[0].register_date;
    }

    return render_params;
};