const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
const access_limitations = require('../helpers/configurations/access_limitations');

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
    let query = {
        name: {
            $regex: new RegExp('^' + plan_name.toLowerCase() + '$', 'i') // case-insensitive
        }
    };
    let query_res = await plans_db_model.find(query).exec();
    return query_res.length > 0;
};

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
    assert.ok(is_plan_exists(req, res, next), "Plan not found.");
    let plans_db_model = database.plans_model();
    let plan_name = requests_handler.require_param(req, "get", "plan_name");
    let query_res = await plans_db_model.find({name: plan_name}, "_id").exec();
    return query_res[0]; // TODO check this result
};

/**
 *
 * @param req
 * req["query"]["username"] - Target user
 * req["query"]["plan_name"] - Check for plan
 *
 * @returns true if user is already registered to this plan, else false.
 */
let is_user_registered_to_plan = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.require_param(req, "get", "username");
    let plan_name = requests_handler.require_param(req, "get", "plan_name");
    let is_register;
    try {
        let query = {
            username: username,
            "plans.$.id": await get_plan_id({query: {plan_name}})
        };
        let query_res = await users_db_model.find(query).exec();
        is_register = query_res.length > 0;
    } catch (e) {
        is_register = false;
    }
    return is_register;
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
        validation_data.query.username = req.session.user.username;
        validation_data.query.plan_name = target_plan;
        assert.ok(is_user_registered_to_plan(validation_data, {}, {}), "You have no access to this plan.");
        query = {name: target_plan};
    } else {
        query = {};
    }

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
    assert.equal(plan_exists, false, "Plan already exists"); // if exists, throw error

    // Get params
    let plan_description = requests_handler.require_param(req, "post", "description");
    let plan_estimated_days = requests_handler.require_param(req, "post", "estimated_days");
    let plan_route = requests_handler.optional_param(req, "post", "tasks_route");
    let plan_active_status = requests_handler.optional_param(req, "post", "active_status");

    // Arrange data
    let data = {
        name: target_plan,
        description: plan_description,
        estimated_days: plan_estimated_days
    };
    if (typeof plan_route != "undefined")           data.roue = plan_route;
    if (typeof plan_active_status != "undefined")   data.is_active = plan_active_status;

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

    // Get params
    let new_plan_name = requests_handler.optional_param(req, "post", "new_plan_name");
    let new_plan_description = requests_handler.optional_param(req, "post", "new_description");
    let new_plan_estimated_days = requests_handler.optional_param(req, "post", "new_estimated_days");
    let new_plan_route = requests_handler.optional_param(req, "post", "new_tasks_route");
    let new_active_status = requests_handler.optional_param(req, "post", "active_status");

    // Arrange new data
    let data = {};
    if (typeof new_plan_name != "undefined")            data.name = new_plan_name;
    if (typeof new_plan_description != "undefined")     data.description = new_plan_description;
    if (typeof new_plan_estimated_days != "undefined")  data.estimated_days = new_plan_estimated_days;
    if (typeof new_plan_route != "undefined")           data.roue = new_plan_route;
    if (typeof new_active_status != "undefined")        data.is_active = new_active_status;

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
    assert.equal(new_plan.ok, true, "Target plan didn't found.");

    return new_plan;
};

exports.remove = async (req, res, next) => {
    // Get DB
    let plans_db_model = database.plans_model();

    // Get params
    let target_plan = requests_handler.require_param(req, "route","plan_name");

    // Validation
    assert.ok(is_plan_exists({query: {plan_name: target_plan}}, {}, {}), "Plan not found.");

    // Perform action
    return plans_db_model.remove({name: target_plan}).exec();
};

exports.get_plan_id = get_plan_id;
exports.is_user_registered_to_plan = is_user_registered_to_plan;
exports.is_plan_exists = is_plan_exists;