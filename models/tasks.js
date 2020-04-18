const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
let topics_model = require('./topics');
const access_limitations = require('../helpers/configurations/access_limitations');

/**
 * @param req
 * req["query"]["topic_id"] - Topic id
 *
 * @returns Number of tasks related to specific topic
 */
let tasks_number_within_topic = async (req, res, next) => {
    let tasks_db_model = database.tasks_model();
    let topic_id = requests_handler.require_param(req, "get", "topic_id");
    let query_res = await tasks_db_model.find({topic_id: topic_id}).exec();
    return query_res.length;
};

let get_task_topic_id = async (task_id) => {
    let tasks_db_model = database.tasks_model();
    let query_res = await tasks_db_model.find({_id: task_id}).exec();
    return query_res[0].topic_id;
};

let is_task_topic_changed = async (task_id, new_topic_id) => {
    let tasks_db_model = database.tasks_model();
    let query_res = await tasks_db_model.find({_id: task_id, topic_id: new_topic_id}).exec();
    return !query_res.length;
};

let is_task_inner_topic_order_changed = async (task_id, new_inner_topic_order) => {
    let tasks_db_model = database.tasks_model();
    let query_res = await tasks_db_model.find({_id: task_id, inner_topic_order: new_inner_topic_order}).exec();
    return !query_res.length;
};

let get_new_place_order_in_topic = async (topic_id) => {
    return await tasks_number_within_topic({query: {topic_id}}, {}, {});
};

/**
 *
 * @param topic_id
 * @param new_place
 * @returns If the place > # of tasks within the topic, returns get_new_place_order_in_topic
 *          If the place < # of tasks within the topic, returns (param) new_place
 *
 * @see get_new_place_order_in_topic
 */
let get_legal_inner_order_within_topic = async (topic_id, new_place) => {
    let number_of_tasks_within_the_topic = await tasks_number_within_topic({query: {topic_id}}, {}, {});
    return Math.min(number_of_tasks_within_the_topic, new_place);
};

let rearrange_task_within_topic = async (task_id, new_topic_id, new_task_place) => {
    let tasks_db_model = database.tasks_model();
    let topic_id = new_topic_id || await get_task_topic_id(task_id);
    let new_task_inner_topic_order = await get_legal_inner_order_within_topic(topic_id, new_task_place);

    let filter, update = {};
    if (new_task_inner_topic_order === Number(new_task_place)) {
        filter = {
            topic_id: topic_id,
            inner_topic_order: {
                $gte: new_task_inner_topic_order
            }
        };
        update = {
            $inc: {
                inner_topic_order: 1
            }
        };
        await tasks_db_model.updateMany(filter, update).exec();
    }
    filter = {
        _id: task_id
    };
    update = {
        $set: {
            inner_topic_order: new_task_inner_topic_order
        }
    };
    await tasks_db_model.updateOne(filter, update).exec();
};

// Decrease all previous topic's tasks inner order, that were after the current updated task
let fix_popout_tasks_order_within_topic = async (task_id) => {
    let tasks_db_model = database.tasks_model();

    let task_details = await tasks_db_model.find({_id: task_id}).exec();
    task_details = task_details[0];

    let filter, update;
    filter = {
        topic_id: task_details.topic_id,
        inner_topic_order: {
            $gt: task_details.inner_topic_order
        }
    };
    update = {
        $inc: {
            inner_topic_order: -1
        }
    };
    await tasks_db_model.updateMany(filter, update).exec();
};

/**
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

exports.is_task_exists = is_task_exists;

/**
 *
 * @param req
 * req["query"]["task_id"]
 * req["query"]["plan_id"]
 *
 * @returns Get the exceptions in the target task to the target plan.
 * If there are exceptions for this plan - return the struct.
 * Else return undefined.
 *
 * @throws assert exception if the task not found.
 */
let get_task_plan_exceptions = async (req, res, next) => {
    // Pre Validation
    assert.ok(await is_task_exists(req, res, next), "Task not found.");

    // Get DB
    let tasks_db_model = database.tasks_model();

    // Get params
    let target_task = requests_handler.require_param(req, "get","task_id");
    let target_plan = requests_handler.require_param(req, "get","plan_id");

    // Prepare query
    let query = {
        _id: target_task
    };

    // Perform action
    let task = await tasks_db_model.find(query).exec();
    task = task[0];
    let plan_exceptions = task.plan_exceptions;
    let target_plan_exceptions = plan_exceptions.filter(plan => plan.id === target_plan);
    return target_plan_exceptions.length ? target_plan_exceptions[0] : undefined;
};

exports.get_task_plan_exceptions = get_task_plan_exceptions;

let is_answer_type_have_auto_check = (answer_type) => {
    return ["TEXT_STRONG", "TEXT_SOFT", "COMPILATION_RESULT", "BOOLEAN", "MULTIPLE_CHOICES"].includes(answer_type);
};

exports.check_answer = (answer_type, legal_answer, answer) => {
    assert.ok(is_answer_type_have_auto_check(answer_type), "Moderator check required.");
    let is_legal_answer = true;


    return is_legal_answer;
};

// API Routes

exports.get = async (req, res, next) => {
    // Get DB
    let tasks_db_model = database.tasks_model();

    // Get params
    let target_task = requests_handler.optional_param(req, "route","task_id");

    // Prepare query
    let query;
    if (target_task) {
        let req = {query: {}};
        req.query.task_id = target_task;
        assert.ok(is_task_exists(req, {}, {}), "Task not found.");
        query = {_id: target_task};
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
    let task_title, task_details;

    // Final Optional Values
    let task_search_keywords, task_check_point, task_answer_type, task_answer_options, task_judgement_criteria,
        task_hints, task_plan_exceptions, task_related_file_names, task_answer, task_code_sections;

    // Final processed values
    let topic_id, task_inner_topic_order;

    // Middleware Values
    let topic_name;

    // Get Required Params
    task_title      =   requests_handler.require_param(req, "post", "title");
    topic_name      =   requests_handler.require_param(req, "post", "topic_name");
    task_details    =   requests_handler.require_param(req, "post", "details");

    // Get Optional Params
    task_search_keywords    =   requests_handler.optional_param(req, "post", "search_keywords");
    task_code_sections      =   requests_handler.optional_param(req, "post", "code_sections");
    task_check_point        =   requests_handler.optional_param(req, "post", "check_point");
    task_answer_type        =   requests_handler.optional_param(req, "post", "answer_type");
    task_answer_options     =   requests_handler.optional_param(req, "post", "answer_options");
    task_judgement_criteria =   requests_handler.optional_param(req, "post", "judgement_criteria");
    task_hints              =   requests_handler.optional_param(req, "post", "hints");
    task_plan_exceptions    =   requests_handler.optional_param(req, "post", "plan_exceptions");
    task_related_file_names =   requests_handler.optional_param(req, "post", "file_names");
    task_answer             =   requests_handler.optional_param(req, "post", "answer");

    // Process Middleware Values
    topic_id = await topics_model.get_topic_id({query:{topic_name: topic_name}}, {}, {}); // TODO check this output
    task_inner_topic_order = await get_new_place_order_in_topic(topic_id);

    // Arrange data
    let data = {
        title: task_title,
        topic_id: topic_id,
        inner_topic_order: task_inner_topic_order,
        details: task_details,
    };

    requests_handler.validate_and_set_array_optional_input(task_answer, data, "answer");
    requests_handler.validate_and_set_array_optional_input(task_search_keywords, data, "search_keywords");
    requests_handler.validate_and_set_array_optional_input(task_code_sections, data, "code_sections");
    requests_handler.validate_and_set_basic_optional_input(task_check_point, data, "check_point");
    requests_handler.validate_and_set_basic_optional_input(task_answer_type, data, "answer_type");
    requests_handler.validate_and_set_array_optional_input(task_answer_options, data, "answer_options");
    requests_handler.validate_and_set_array_optional_input(task_judgement_criteria, data, "judgement_criteria");
    requests_handler.validate_and_set_array_optional_input(task_hints, data, "hints");
    requests_handler.validate_and_set_array_optional_input(task_plan_exceptions, data, "plan_exceptions");
    requests_handler.validate_and_set_array_optional_input(task_related_file_names, data, "file_names");

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
        task_answer_type, task_answer_options, task_judgement_criteria, task_hints, task_plan_exceptions,
        task_related_file_names, task_code_sections;

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
    task_code_sections = requests_handler.optional_param(req, "post", "code_sections");
    task_answer_type = requests_handler.optional_param(req, "post", "answer_type");
    task_answer_options = requests_handler.optional_param(req, "post", "answer_options");
    task_judgement_criteria = requests_handler.optional_param(req, "post", "judgement_criteria");
    task_hints = requests_handler.optional_param(req, "post", "hints");
    task_plan_exceptions = requests_handler.optional_param(req, "post", "plan_exceptions");
    task_related_file_names = requests_handler.optional_param(req, "post", "file_names");

    // Process Middleware Values
    let is_topic_changed, is_inner_order_changed;
    is_topic_changed = is_inner_order_changed = false;
    if (topic_name) {
        topic_id = await topics_model.get_topic_id({query: {topic_name: topic_name}}, {}, {}); // TODO check this output
        is_topic_changed = await is_task_topic_changed(target_task, topic_id);
    }

    if (task_inner_topic_order) {
        is_inner_order_changed = await is_task_inner_topic_order_changed(target_task, task_inner_topic_order);
    }

    // Pre Validations / Pre Process
    if (is_inner_order_changed) {
        await fix_popout_tasks_order_within_topic(target_task);
        await rearrange_task_within_topic(target_task, topic_id, task_inner_topic_order);
    } else if (is_topic_changed) {
        await fix_popout_tasks_order_within_topic(target_task);
        task_inner_topic_order = await get_new_place_order_in_topic(topic_id);
    }

    // Arrange data
    let data = {};

    requests_handler.validate_and_set_basic_optional_input(task_title, data, "title");
    requests_handler.validate_and_set_basic_optional_input(topic_id, data, "topic_id");
    requests_handler.validate_and_set_basic_optional_input(task_details, data, "details");
    requests_handler.validate_and_set_array_optional_input(task_answer, data, "answer");
    requests_handler.validate_and_set_basic_optional_input(task_inner_topic_order, data, "inner_topic_order");
    requests_handler.validate_and_set_array_optional_input(task_search_keywords, data, "search_keywords");
    requests_handler.validate_and_set_basic_optional_input(task_check_point, data, "check_point");
    requests_handler.validate_and_set_array_optional_input(task_code_sections, data, "code_sections");
    requests_handler.validate_and_set_basic_optional_input(task_answer_type, data, "answer_type");
    requests_handler.validate_and_set_array_optional_input(task_answer_options, data, "answer_options");
    requests_handler.validate_and_set_array_optional_input(task_judgement_criteria, data, "judgement_criteria");
    requests_handler.validate_and_set_array_optional_input(task_hints, data, "hints");
    requests_handler.validate_and_set_array_optional_input(task_plan_exceptions, data, "plan_exceptions");
    requests_handler.validate_and_set_array_optional_input(task_related_file_names, data, "file_names");

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

    await fix_popout_tasks_order_within_topic(target_task);
    // TODO remove related files from db

    // Perform action
    return tasks_db_model.remove({_id: target_task}).exec();
};


// Data Structures

exports.system_tasks = {
    strong_check_point: {
        title: "Check Point - Please wait for tasks review",
        details: "The last submitted task was a check-point task, which means that you have to wait for administrator review before continue to your next task in this plan." +
            "If you are register to another plans, you may continue with their paths or learn something until administrator will be free to review your response.",
        is_system_task: true
    },
    plan_completed: {
        title: "!Congratulation!",
        details: "Congratulation! You just hit the end of the plan! Please contact your administrator and let him know.",
        is_system_task: true
    }
};