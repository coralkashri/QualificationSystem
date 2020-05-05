const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
const access_limitations = require('../helpers/configurations/access_limitations');
let users_model = require('./users');
let topics_model = require('./topics');
let tasks_model = require('./tasks');

// Value extract / calculate functions

/**
 *
 * @param req
 * req["query"]["plan_name"] - Plan name
 *
 * @returns true if exists, else false.
 */
let is_plan_exists = async (req, res, next) => {
    let plans_db_model = database.plans_model();
    let plan_name = requests_handler.require_param(req, "get", "plan_name");
    plan_name = plan_name.replace(/([\/,!?_+])/g, '\\$1');
    let query = {
        name: {
            $regex: new RegExp('^' + plan_name.toLowerCase() + '$', 'i') // case-insensitive
        }
    };
    let query_res = await plans_db_model.find(query).exec();
    return query_res.length > 0;
};

exports.is_plan_exists = is_plan_exists;

/**
 *
 * @param req
 * req["query"]["plan_name"] - Plan name
 *
 * @returns true if exists, else false.
 */
let is_plan_archived = async (req, res, next) => {
    let plans_db_model = database.plans_model();
    let plan_name = requests_handler.require_param(req, "get", "plan_name");
    plan_name = plan_name.replace(/([\/,!?_+])/g, '\\$1');
    let query = {
        name: {
            $regex: new RegExp('^' + plan_name.toLowerCase() + '$', 'i') // case-insensitive
        }
    };
    let query_res = await plans_db_model.find(query, "is_active").exec();
    return !query_res[0].is_active;
};

exports.is_plan_archived = is_plan_archived;

/**
 *
 * @param req
 * req["query"]["plan_name"] - Plan name
 *
 * @returns plan's id.
 *
 * @throws Assert exception if plan not found.
 */
let get_plan_id = async (req, res, next) => {
    assert.ok(await is_plan_exists(req, res, next), "Plan not found.");
    let plans_db_model = database.plans_model();
    let plan_name = requests_handler.require_param(req, "get", "plan_name");
    let query_res = await plans_db_model.find({name: plan_name}, "_id").exec();
    return query_res[0]._id; // TODO check this result
};

exports.get_plan_id = get_plan_id;

/**
 *
 * @param req
 * (require) req["query"]["plan_name"] - Plan name
 *
 * @returns An array of tasks ids.
 *
 * @throws Assert exception if plan not found.
 */
let get_plan_tasks = async (req, res, next) => {
    assert.ok(await is_plan_exists(req, res, next), "Plan not found.");
    let plans_db_model = database.plans_model();
    let plan_name = requests_handler.require_param(req, "get", "plan_name");

    let query_res = await plans_db_model.find({name: plan_name}, "route").exec();
    return query_res[0].route;
};

exports.get_plan_tasks = get_plan_tasks;

/**
 *
 * @param req
 * (require) req["query"]["plan_name"] - Plan name
 * (require) req["query"]["task_id"] - Task id
 *
 * @returns true if exists, else false.
 *
 * @throws Assert exception if plan not found.
 */
let is_task_exists = async (req, res, next) => {
    assert.ok(await is_plan_exists(req, res, next), "Plan not found.");
    let plans_db_model = database.plans_model();
    let plan_name = requests_handler.require_param(req, "get", "plan_name");
    let task_id = requests_handler.require_param(req, "get", "task_id");

    let query_res = await plans_db_model.find({name: plan_name, route: task_id}).exec();
    return query_res.length > 0; // TODO check this result
};

/**
 *
 * @param req
 * (require) req["query"]["plan_name"] - Plan name
 * (optional) req["query"]["task_id"] - Current task id, if not exists will return first task id
 *
 * @returns Next / First task id.
 *          Will return undefined, if the request task is the last one in the plan.
 *
 * @throws Assert exception if plan not found.
 * @throws Assert exception if task not found.
 */
let get_plan_next_mission_id = async (req, res, next) => {
    assert.ok(await is_plan_exists(req, res, next), "Plan not found.");
    let plans_db_model = database.plans_model();

    // Extract params
    let current_task_id = requests_handler.optional_param(req, "get", "task_id");

    // Task validation
    if (current_task_id) {
        assert.ok(await is_task_exists(req, res, next), "Task not found in this plan.");
    }

    // Find the next task
    let plan_tasks = await get_plan_tasks(req, res, next);
    let next_mission_id;
    if (current_task_id) {
        for (let i = 0; i < plan_tasks.length; i++) {
            if (plan_tasks[i] === current_task_id) {
                if (i < plan_tasks.length - 1)
                    next_mission_id = plan_tasks[i + 1];
                else // Last task
                    next_mission_id = undefined;
            }
        }
    } else { // First task request
        next_mission_id = plan_tasks[0];
    }

    return next_mission_id; // TODO check this result
};

exports.get_plan_next_mission_id = get_plan_next_mission_id;

/**
 * @param req
 * req["query"]["route"] - Task ids array
 *
 * @throws Assert exception on dependencies issues
 */
let validate_tasks_route = async (req, res, next) => {

    let route = requests_handler.require_param(req, "get", "route");
    route = JSON.parse(route);

    // Get each task topic_id
    let topics = [];
    for (let i = 0; i < route.length; i++) {
        req.params.task_id = route[i];
        let task_data = (await tasks_model.get(req, {}, {}))[0];
        topics.push({id: task_data.topic_id});
    }

    // For each topic get dependencies list
    for (let i = 0; i < topics.length; i++) {
        req.params.topic_id = topics[i].id;
        let topic_data = (await topics_model.get(req, {}, {}))[0];
        topics[i].dependencies = topic_data.dependencies_topics;
        topics[i].name = topic_data.name;
    }

    // Go from the end of the topics list to the current topic, and check if the current one is dependency of another
    for (let topic_number = 1; topic_number < topics.length; topic_number++) {
        let current_topic_name = topics[topic_number].name;

        for (let suspect_number = topic_number - 1; suspect_number < topic_number; suspect_number++) {
            assert.ok(!topics[suspect_number].dependencies.includes(current_topic_name), "Wrong tasks' topics dependencies order.")
        }
    }
};


// API

exports.get_plan_details_by_id = async (req, res, next) => {
    // Get DB
    let plans_db_model = database.plans_model();

    // Get params
    let target_plan = requests_handler.require_param(req, "get","plan_id");

    // Perform action
    let plan_details = await plans_db_model.find({_id: target_plan}, "-_id").exec();

    // Post Validation
    assert.ok(plan_details.length, "Plan not found.");

    return plan_details[0];
};

exports.get = async (req, res, next) => {
    // Get DB
    let plans_db_model = database.plans_model();

    // Get params
    let target_plan;
    target_plan = requests_handler.optional_param(req, "route","plan_name");

    // Prepare query
    let query;
    if (target_plan) {
        let validation_data = {query: {}};
        validation_data.query.username = req.user.username;
        validation_data.query.plan_name = target_plan;
        validation_data.query.user_role = req.user.role;
        assert.ok(await users_model.is_plan_accessible_by_user(validation_data, {}, {}), "You have no access to this plan.");
        query = {name: target_plan};
    } else {
        query = {};
    }

    if (!req.user || req.user.role < access_limitations.min_access_required.view_archived_plans)
        query.is_active = true;

    // Perform query
    return await plans_db_model.find(query).exec();
};

exports.create = async (req, res, next) => {
    // Get DB
    let plans_db_model = database.plans_model();

    // Get main param
    let target_plan = requests_handler.require_param(req, "route","plan_name");

    // Validation
    let plan_exists = await is_plan_exists({ query: { plan_name: target_plan } });
    assert.equal(plan_exists, false, "Plan already exists."); // If exists, throw error

    // Get params
    let plan_description =      requests_handler.require_param(req, "post", "description");
    let plan_estimated_days =   requests_handler.require_param(req, "post", "estimated_days");
    let plan_route =            requests_handler.optional_param(req, "post", "tasks_route");
    let plan_active_status =    requests_handler.optional_param(req, "post", "active_status");

    // Arrange data
    let data = {
        name: target_plan,
        description: plan_description,
        estimated_days: plan_estimated_days
    };
    requests_handler.validate_and_set_array_optional_input(plan_route, data, "route");

    // Validate tasks route
    if (plan_route) {
        req.query.route = plan_route;
        await validate_tasks_route(req, res, next);
    }

    if (req.user.role >= access_limitations.min_access_required.archive_plans)
        requests_handler.validate_and_set_basic_optional_input(plan_active_status, data, "is_active");

    // Perform action
    let new_plan;
    new_plan = new plans_db_model(data);
    new_plan = new_plan.save();

    return new_plan;
};

exports.modify = async (req, res, next) => {
    // Get DB
    let plans_db_model = database.plans_model();

    // Get main param
    let target_plan = requests_handler.require_param(req, "route","plan_name");

    // Pre Validation
    let plan_exists = await is_plan_exists({ query: { plan_name: target_plan } });
    assert.ok(plan_exists, "Plan not found."); // If not exists, throw error

    // Get params
    let new_plan_name =             requests_handler.optional_param(req, "post", "new_plan_name");
    let new_plan_description =      requests_handler.optional_param(req, "post", "new_description");
    let new_plan_estimated_days =   requests_handler.optional_param(req, "post", "new_estimated_days");
    let new_plan_route =            requests_handler.optional_param(req, "post", "new_tasks_route");
    let new_active_status =         requests_handler.optional_param(req, "post", "active_status");

    // Arrange new data
    let data = {};
    requests_handler.validate_and_set_basic_optional_input(new_plan_name, data, "name");
    requests_handler.validate_and_set_basic_optional_input(new_plan_description, data, "description");
    requests_handler.validate_and_set_basic_optional_input(new_plan_estimated_days, data, "estimated_days");
    requests_handler.validate_and_set_array_optional_input(new_plan_route, data, "route");
    if (req.user.role >= access_limitations.min_access_required.archive_plans)
        requests_handler.validate_and_set_basic_optional_input(new_active_status, data, "is_active");

    // Validate tasks route
    if (new_plan_route) {
        req.query.route = new_plan_route;
        await validate_tasks_route(req, res, next);
    }

    // Prepare query
    let filter = {name: target_plan};
    let update = {
        $set: data
    };

    // Perform action
    let new_plan = await plans_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();

    // Post Validation
    assert.equal(new_plan.ok, true, "Target plan update failed.");

    return new_plan;
};

exports.remove = async (req, res, next) => {
    // Get DB
    let plans_db_model = database.plans_model();

    // Get params
    let target_plan = requests_handler.require_param(req, "route","plan_name");

    // Validation
    let plan_exists = await is_plan_exists({ query: { plan_name: target_plan } });
    assert.ok(plan_exists, "Plan not found."); // If not exist, throw error

    // Perform action
    return plans_db_model.remove({name: target_plan}).exec();

    // TODO remove this plan from users that are register to it.
};