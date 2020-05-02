const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
const access_limitations = require('../helpers/configurations/access_limitations');
let plans_model = require('./plans');
let tasks_model = require('./tasks');

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

/**
 * @param req
 * (require) req["query"]["username"] - Target user
 * (require) req["query"]["plan_name"] - Check for plan
 * (optional) req["query"]["user_role"]
 *
 * @returns true if the user is able to register to target plan, else false.
 */
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
            "plans.id": await plans_model.get_plan_id(req, res, next)
        };
        let query_res = await users_db_model.find(query).exec();
        is_register = query_res.length > 0;
    } catch (e) {
        is_register = false;
    }
    return is_register;
};

exports.is_user_registered_to_plan = is_user_registered_to_plan;

/**
 * @param req - pure request variable, checks for req.user.role
 * @param target_username - Username to access it's data.
 *
 * @throws Error if the current user have no permissions to access the desired data.
 */
let validate_user_access_to_user_data = (req, target_username) => {
    if (req.user && req.user.role < access_limitations.min_access_required.view_users_details && req.user.username !== target_username) {
        throw new Error("You have no permission to watch this user.");
    }
};

/**
 * @param req
 * req["query"]["username"] - Target user
 * req["query"]["plan_name"] - Check for plan
 *
 * @returns The plan data related to the user (in pseudo DB: users[target_user].plans[target_plan])
 */
let get_user_plan_data = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Extract main param
    let username = requests_handler.require_param(req, "route", "username");
    let target_plan_id = (await plans_model.get_plan_id(req, res, next)).toString();

    // Validations
    validate_user_access_to_user_data(req, username);

    assert.ok(await is_user_registered_to_plan(req, res, next), "User does not registered to this plan.");

    let query = {};
    query.username = username;
    let user_data = await users_db_model.find(query, '-password').exec();
    user_data = user_data[0];
    return user_data.plans.filter((plan) => plan.id === target_plan_id)[0];
};

/**
 * @param req
 * req["query"]["username"] - Target user
 * req["query"]["plan_name"] - Check for plan
 *
 * @returns The plan current task id related to the user (in pseudo DB: users[target_user].plans[target_plan].current_task.id)
 */
let get_user_plan_current_task_id = async (req, res, next) => {
    return (await get_user_plan_data(req, res, next)).current_task.id;
};

// API

exports.get_current_plan_task = async (req, res, next) => {
    // Prepare params for future access
    req.query.username = req.params.username;
    req.query.plan_name = req.params.plan_name;

    // Arrange data
    let user_plan_data = await get_user_plan_data(req, res, next);
    req.params.task_id = user_plan_data.current_task.id;

    let current_task = await tasks_model.get(req, res, next);

    if (user_plan_data.current_task.status === "Completed") {
        current_task = [tasks_model.system_tasks.plan_completed];
    }

    if (current_task.check_point === "STRONG") {
        if (user_plan_data.current_task.status !== "In Progress") {
            current_task = [tasks_model.system_tasks.strong_check_point];
        }
    }

    if (current_task.length > 1) {
        current_task = [tasks_model.system_tasks.missions_in_review];
    }

    return current_task;
};

exports.get_plan_progress = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Extract param
    let username = requests_handler.require_param(req, "route", "username");

    // Prepare params for future access
    req.query.username = req.params.username;
    req.query.plan_name = req.params.plan_name;

    // Arrange data
    let plan_details = (await plans_model.get(req, res, next))[0];
    let plan_route = plan_details.route;

    let user_plan = await get_user_plan_data(req, res, next);
    let current_user_task_id = user_plan.current_task.id;

    // Get Progress Algorithm
    req.query.plan_id = plan_details._id.toString(); // Used inside the loop in the call for tasks_model.get_task_plan_exceptions
    let is_user_completed_current_task = true; // Inside the loop, indicates if the current checked task is already completed by this user.
    let progress;
    let current_user_plan_progress_value; // TODO consider to save in the DB to save time
    let total_plan_progress_value; // TODO consider to save in the DB to save time

    current_user_plan_progress_value = total_plan_progress_value = 0;
    for (let i = 0; i < plan_route.length; i++) {
        let task_id = plan_route[i];
        req.query.task_id = task_id;
        let task_value;
        let plan_exceptions = await tasks_model.get_task_plan_exceptions(req, res, next);
        if (!plan_exceptions) {
            task_value = 1;
        } else {
            task_value = plan_exceptions.task_progress_value || 1;
        }
        if (current_user_task_id === task_id) {
            is_user_completed_current_task = false;
        }
        if (is_user_completed_current_task) {
            current_user_plan_progress_value += task_value;
        }
        total_plan_progress_value += task_value;
    }
    progress = current_user_plan_progress_value / total_plan_progress_value;
    return {
        value: progress,
        is_tasks_declined: user_plan.declined_tasks.length,
        is_tasks_waiting_for_review: user_plan.tasks_for_review.length
    };
};

exports.get = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Extract params
    let username = requests_handler.optional_param(req, "route", "username");
    let password = requests_handler.optional_param(req, "get", "password");
    if (password) {
        password = hash(password);
    }
    // Validation
    validate_user_access_to_user_data(req, username);

    /* Assumptions here:
    *   1. The user might be logged in OR logged out.
    *
    *   2. If the user is logged in:
    *   2.1. The user have an access to view all the users.
    *   2.2. The user requested to view his self profile.
    * */

    // Arrange data
    let query = {};
    if (username) { // Get specific user by username
        query.username = username;
        if (!req.user) { // [For login] If not logged in already require password
            // Validation
            assert.ok(password, "Password is required.");
        }
        if (password) {
            query.password = password;
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
    let current_password = requests_handler.optional_param(req, "post", "current_password");
    if (current_password) {
        current_password = hash(current_password);
    }

    assert.ok(!!req.session.user, "User disconnected, please login.");

    // Get params
    if (req.session.user.role < access_limitations.min_access_required.modify_all_users) {
        assert.ok(current_password, "Password is required.");
    }
    let new_username = requests_handler.optional_param(req, "post", "username");
    let new_password = requests_handler.optional_param(req, "post", "password");
    new_password = new_password && hash(new_password);
    let new_role = requests_handler.optional_param(req, "post", "role");

    // Pre Validations
    // TODO Add a password validation for the current logged in user -- Even for administrator, to make sure that he is the one that send the request.

    if (!current_password) {
        assert.ok(await is_username_exists({query: {username}}), "User not found"); // If not exists, throw error
    } else {
        req.query.password = req.body.current_password;
        assert.ok((await exports.get(req)).length > 0, "Wrong validation password.");
    }

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
        filter.password = current_password;
        delete update.$set.role;
    }

    // Perform action
    let new_user = await users_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();

    // Post Validations
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

    // Validation
    assert.ok(await is_plan_registrable_by_user(req, res, next), "Can't register this user to this plan.");

    if (req.user.role < access_limitations.min_access_required.register_other_users_to_plans) {
        assert(req.user.username === username, "You don't have a permission to register other users to plans.");
    }

    // Extract required details
    let plan_id = await plans_model.get_plan_id(req);
    let first_task_id = await plans_model.get_plan_next_mission_id(req);
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

exports.skip_task = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Get main params
    let username = requests_handler.require_param(req, "route", "username");
    let task_id = requests_handler.require_param(req, "route", "task_id");

    // Set params for future queries
    req.query.username = username;
    req.query.plan_name = req.params.plan_name;

    // Route Validation: the current user have a permission to skip tasks

    // Validation

    if (req.user.role < access_limitations.min_access_required.manage_other_users_plans) {
        assert(req.user.username === username, "You don't have a permission to manage other users' plans.");
    }

    // Extract required details
    let plan_id = await plans_model.get_plan_id(req);
    let next_task_id = await plans_model.get_plan_next_mission_id(req);

    // Prepare query
    let filter = {
        username: username,
        "plans.id": plan_id
    };
    let update = {
        $set: {
            "plans.$.current_task": {
                id: next_task_id
            }
        },
        $push: {
            "plans.$.skipped_tasks": task_id
        }
    };

    // Perform action
    let new_user = await users_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();

    // Post Validation
    assert.equal(new_user.ok, true, "Task skip failed.");

    return new_user;
};

exports.submit_task = async (req, res, next) => {
    // Get DB
    let users_db_model = database.users_model();

    // Get main params
    let username = requests_handler.require_param(req, "route", "username");
    let task_id = requests_handler.require_param(req, "route", "task_id");

    // Get params
    let user_answer = requests_handler.require_param(req, "post", "answer");
    user_answer = JSON.parse(user_answer);

    // Set params for future queries
    req.query.username = username;
    req.query.plan_name = req.params.plan_name;

    // Validation

    if (req.user.role < access_limitations.min_access_required.manage_other_users_plans) {
        assert(req.user.username === username, "You don't have a permission to manage other users' plans.");
    }

    // Extract required details
    let plan_id = await plans_model.get_plan_id(req);
    let task_details = await tasks_model.get(req, res, next);
    task_details = task_details[0];
    req.query.task_id = task_id;
    let next_task_id = await plans_model.get_plan_next_mission_id(req);

    // Test submitted answer

    let answer_status;
    let response_to_user;
    let update = undefined;
    let is_task_failed = false;
    try {
        // Auto test
        answer_status = tasks_model.check_answer(task_details.answer_type, task_details.answer, user_answer);
        if (answer_status) {
            response_to_user = "Mission accomplished!";
            update = {
                $push: {
                    "plans.$.completed_tasks": {
                        id: task_id,
                        answer: user_answer,
                        reviewer: "System",
                        reviewer_msg: "Task completed"
                    }
                }
            };
            if (next_task_id) { // Set next task id
                update.$set = {
                    "plans.$.current_task": {
                        id: next_task_id,
                        status: "In Progress"
                    }
                };
            } else { // Plan Completed
                update.$set = {
                    "plans.$.current_task": {
                        status: "Completed"
                    }
                }
            }
        } else { // No Update
            is_task_failed = true;
            response_to_user = "Wrong answer, try again.";
        }
    } catch(e) {
        // Send to review
        response_to_user = "Answer sent to review.";
        update = {
            $push: {
                "plans.$.tasks_for_review": {
                    id: task_id,
                    answer: user_answer
                }
            }
        };
        // Check task CHECK_POINT
        if (["NONE", "SOFT"].includes(task_details.check_point)) {
            update.$set = {
                "plans.$.current_task": {
                    id: next_task_id,
                    status: "In Progress"
                }
            }
        } else { // Strong CHECK_POINT
            update.$set = {
                "plans.$.current_task": {
                    status: "In Review"
                }
            }
        }
    }

    if (update) {
        // Prepare query
        let filter = {
            username: username,
            "plans.id": plan_id
        };

        // Perform action
        let new_user = await users_db_model.updateOne(filter, update, {
            new: true // Return the new object after the update is applied
        }).exec();

        // Post Validation
        assert.equal(new_user.ok, true, "Task submission failed.");
    }

    return {
        msg: response_to_user,
        failed: is_task_failed
    };
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