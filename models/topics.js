const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
const access_limitations = require('../helpers/configurations/access_limitations');

/**
 *
 * @param req
 * req["query"]["topic_name"] - Plan name
 *
 * @returns true if exists, else false.
 */
let is_topic_exists = async (req, res, next) => {
    let topics_db_model = database.topics_model();
    let topic_name = requests_handler.require_param(req, "get", "topic_name");
    let query = {
        name: {
            $regex: new RegExp('^' + topic_name.toLowerCase() + '$', 'i') // case-insensitive
        }
    };
    let query_res = await topics_db_model.find(query).exec();
    return query_res.length > 0;
};

/**
 *
 * @param req
 * req["query"]["topic_name"] - Topic name
 *
 * @returns topic's id.
 *
 * @throws Assert exception if topic not found.
 */
let get_topic_id = async (req, res, next) => {
    assert.ok(is_topic_exists(req, res, next), "Topic not found.");
    let topics_db_model = database.topics_model();
    let topic_name = requests_handler.require_param(req, "get", "topic_name");
    let query_res = await topics_db_model.find({name: topic_name}, "_id").exec();
    return query_res[0]; // TODO check this result
};

exports.get = async (req, res, next) => {
    // Get DB
    let topics_db_model = database.topics_model();

    // Get params
    let target_topic;
    target_topic = requests_handler.optional_param(req, "route","topic_name");

    // Prepare query
    let query;
    if (target_topic) {
        let req = {query: {}};
        req.query.topic_name = target_topic;
        assert.ok(is_topic_exists(req, {}, {}), "Topic not found.");
        query = {name: target_topic};
    } else {
        query = {};
    }

    // Perform query
    return await topics_db_model.find(query).exec();
};

exports.create = async (req, res, next) => {
    // Get DB
    let topics_db_model = database.topics_model();

    // Get main param
    let target_topic = requests_handler.require_param(req, "route","topic_name");

    // Validation
    let topic_exists = await is_topic_exists({ query: { topic_name: target_topic } });
    assert.equal(topic_exists, false, "Topic already exists"); // if exists, throw error

    // Get params
    let topic_description = requests_handler.require_param(req, "post", "description");
    let topic_dependencies = requests_handler.optional_param(req, "post", "dependencies");
    let topic_active_status = requests_handler.optional_param(req, "post", "active_status");

    // Arrange data
    let data = {
        name: target_topic,
        description: topic_description
    };
    if (typeof topic_dependencies != "undefined") {
        topic_dependencies = topic_dependencies && topic_dependencies.split(',');
        data.dependencies_topics = topic_dependencies || [];
    }
    if (typeof topic_active_status != "undefined")  data.is_active = topic_active_status;

    // Perform action
    let new_topic;
    new_topic = new topics_db_model(data);
    new_topic = new_topic.save();

    return new_topic;
};

exports.modify = async (req, res, next) => {
    // Get DB
    let topics_db_model = database.topics_model();

    // Get main param
    let target_topic = requests_handler.optional_param(req, "route","topic_name");

    // Get params
    let new_topic_name = requests_handler.optional_param(req, "post", "new_topic_name");
    let new_topic_description = requests_handler.optional_param(req, "post", "new_topic_description");
    let new_topic_dependencies = requests_handler.optional_param(req, "post", "new_topic_dependencies");
    let new_topic_active_status = requests_handler.optional_param(req, "post", "new_topic_active_status");


    // Arrange new data
    let data = {};
    if (typeof new_topic_name != "undefined")           data.name = new_topic_name;
    if (typeof new_topic_description != "undefined")    data.description = new_topic_description;
    if (typeof new_topic_dependencies != "undefined") {
        new_topic_dependencies = new_topic_dependencies && new_topic_dependencies.split(',');
        data.dependencies_topics = new_topic_dependencies || [];
    }
    if (typeof new_topic_active_status != "undefined")  data.is_active = new_topic_active_status;

    // Prepare query
    let filter = {name: target_topic};
    let update = {
        $set: data
    };

    // Perform action
    let new_topic = await topics_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();

    // Post Validation
    assert.equal(new_topic.ok, true, "Target topic didn't found.");

    return new_topic;
};

exports.remove = async (req, res, next) => {
    // Get DB
    let topics_db_model = database.topics_model();

    // Get params
    let target_topic = requests_handler.optional_param(req, "route","topic_name");

    // Validation
    assert.ok(is_topic_exists({query: {topic_name: target_topic}}, {}, {}), "Topic not found.");

    // Perform action
    return topics_db_model.remove({name: target_topic}).exec();

    // TODO delete as well all topic related tasks
};

exports.get_topic_id = get_topic_id;
exports.is_topic_exists = is_topic_exists;