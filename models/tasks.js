const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
let topics_model = require('./topics');
const access_limitations = require('../helpers/configurations/access_limitations');

/**
 *
 * @param req
 * req["query"]["task_id"] - Task id
 *
 * @returns true if exists, else false.
 */
let is_task_exists = async (req, res, next) => {
    let tasks_db_model = database.tasks_model();
    let task_id = requests_handler.require_param(req, "get", "task_id");
    let query_res = await tasks_db_model.find({_id: task_id}).exec();
    return query_res.length > 0;
};

exports.get = async (req, res, next) => {
    // Get DB
    let tasks_db_model = database.tasks_model();

    // Get params
    let target_task;
    target_task = requests_handler.optional_param(req, "route","task_id");

    // Prepare query
    let query;
    if (target_task) {
        let req = {query: {}};
        req.query.task_id = target_task;
        assert.ok(is_task_exists(req, {}, {}), "Task not found.");
        query = {name: target_task};
    } else {
        query = {};
    }

    // Perform query
    return await tasks_db_model.find(query).exec();
};

exports.create = async (req, res, next) => {
    // Get DB
    let tasks_db_model = database.tasks_model();

    // Final Values
    let task_title, topic_id, task_details, task_answer;

    // Final Optional Values
    let task_inner_topic_order, task_search_keywords, task_check_point, task_type, task_judgement_criteria, task_hints,
        task_plan_exceptions;

    // Middleware Values
    let topic_name;

    // Get Required Params
    task_title = requests_handler.require_param(req, "post", "title");
    topic_name = requests_handler.require_param(req, "post", "topic_name");
    task_details = requests_handler.require_param(req, "post", "details");
    task_answer = requests_handler.require_param(req, "post", "answer");

    // Get Optional Params
    task_inner_topic_order = requests_handler.optional_param(req, "post", "inner_topic_order");
    task_search_keywords = requests_handler.optional_param(req, "post", "search_keywords");
    task_check_point = requests_handler.optional_param(req, "post", "check_point");
    task_type = requests_handler.optional_param(req, "post", "type");
    task_judgement_criteria = requests_handler.optional_param(req, "post", "judgement_criteria");
    task_hints = requests_handler.optional_param(req, "post", "hints");
    task_plan_exceptions = requests_handler.optional_param(req, "post", "plan_exceptions");

    // Process Middleware Values
    topic_id = await topics_model.get_topic_id({query:{topic_name: topic_name}}, {}, {}); // TODO check this output

    // Arrange data
    let data = {
        title: task_title,
        topic_id: topic_id,
        details: task_details,
        answer: task_answer
    };

    requests_handler.validate_and_set_basic_optional_input(task_inner_topic_order, data, "inner_topic_order");
    requests_handler.validate_and_set_array_optional_input(task_search_keywords, data, "search_keywords");
    requests_handler.validate_and_set_basic_optional_input(task_check_point, data, "check_point");
    requests_handler.validate_and_set_basic_optional_input(task_type, data, "type ");
    requests_handler.validate_and_set_array_optional_input(task_judgement_criteria, data, "judgement_criteria");
    requests_handler.validate_and_set_array_optional_input(task_hints, data, "hints");
    requests_handler.validate_and_set_array_optional_input(task_plan_exceptions, data, "plan_exceptions");

    // Perform action
    let new_task;
    new_task = new tasks_db_model(data);
    new_task = new_task.save();

    return new_task;
};

exports.modify = async (req, res, next) => {
    // Get DB
    let tasks_db_model = database.tasks_model();

    // Final Values
    let target_task;

    // Final Optional Values
    let task_title, topic_id, task_details, task_answer, task_inner_topic_order, task_search_keywords, task_check_point,
        task_type, task_judgement_criteria, task_hints, task_plan_exceptions;

    // Middleware Values
    let topic_name;

    // Get Main Param
    target_task = requests_handler.require_param(req, "route", "task_id");

    // Pre Validation
    let task_exists = await is_task_exists({ query: { task_id: target_task } });
    assert.ok(task_exists, "Task not found."); // If not exist, throw error

    // Get Optional Params
    task_title = requests_handler.optional_param(req, "post", "title");
    topic_name = requests_handler.optional_param(req, "post", "topic_name");
    task_details = requests_handler.optional_param(req, "post", "details");
    task_answer = requests_handler.optional_param(req, "post", "answer");
    task_inner_topic_order = requests_handler.optional_param(req, "post", "inner_topic_order");
    task_search_keywords = requests_handler.optional_param(req, "post", "search_keywords");
    task_check_point = requests_handler.optional_param(req, "post", "check_point");
    task_type = requests_handler.optional_param(req, "post", "type");
    task_judgement_criteria = requests_handler.optional_param(req, "post", "judgement_criteria");
    task_hints = requests_handler.optional_param(req, "post", "hints");
    task_plan_exceptions = requests_handler.optional_param(req, "post", "plan_exceptions");

    // Process Middleware Values
    topic_id = await topics_model.get_topic_id({query:{topic_name: topic_name}}, {}, {}); // TODO check this output

    // Arrange data
    let data = {};

    requests_handler.validate_and_set_basic_optional_input(task_title, data, "title");
    requests_handler.validate_and_set_basic_optional_input(topic_id, data, "topic_id");
    requests_handler.validate_and_set_basic_optional_input(task_details, data, "details");
    requests_handler.validate_and_set_basic_optional_input(task_answer, data, "answer");
    requests_handler.validate_and_set_basic_optional_input(task_inner_topic_order, data, "inner_topic_order");
    requests_handler.validate_and_set_array_optional_input(task_search_keywords, data, "search_keywords");
    requests_handler.validate_and_set_basic_optional_input(task_check_point, data, "check_point");
    requests_handler.validate_and_set_basic_optional_input(task_type, data, "type ");
    requests_handler.validate_and_set_array_optional_input(task_judgement_criteria, data, "judgement_criteria");
    requests_handler.validate_and_set_array_optional_input(task_hints, data, "hints");
    requests_handler.validate_and_set_array_optional_input(task_plan_exceptions, data, "plan_exceptions");

    // Prepare query
    let filter = {_id: target_task};
    let update = {
        $set: data
    };

    // Perform action
    let new_task = await tasks_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();

    // Post Validation
    assert.equal(new_task.ok, true, "Target task update failed.");

    return new_task;
};

exports.remove = async (req, res, next) => {
    // Get DB
    let tasks_db_model = database.tasks_model();

    // Get params
    let target_task = requests_handler.optional_param(req, "route","task_id");

    // Validation
    let task_exists = await is_task_exists({ query: { task_id: target_task } });
    assert.ok(task_exists, "Task not found."); // If not exist, throw error

    // Perform action
    return tasks_db_model.remove({_id: target_task}).exec();
};

exports.is_task_exists = is_task_exists;