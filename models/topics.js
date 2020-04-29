const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
const access_limitations = require('../helpers/configurations/access_limitations');

/**
 *
 * @param req
 * req["query"]["topic_name"] - Topic name
 * req["query"]["topic_name"] - Topic id
 * -- One of them must exists, if both exists check for name
 *
 * @returns true if exists, else false.
 */
let is_topic_exists = async (req, res, next) => {
    let topics_db_model = database.topics_model();
    let topic_name = requests_handler.optional_param(req, "get", "topic_name");
    let topic_id;
    let query;
    if (!topic_name) {
        topic_id = requests_handler.require_param(req, "get", "topic_id");
        query = {_id: topic_id};
    } else {
        query = {
            name: {
                $regex: new RegExp('^' + topic_name.toLowerCase() + '$', 'i') // case-insensitive
            }
        };
    }
    let query_res = await topics_db_model.find(query).exec();
    return query_res.length > 0;
};

exports.is_topic_exists = is_topic_exists;

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
    assert.ok(await is_topic_exists(req, res, next), "Topic not found.");
    let topics_db_model = database.topics_model();
    let topic_name = requests_handler.require_param(req, "get", "topic_name");
    let query_res = await topics_db_model.find({name: topic_name}, "_id").exec();
    return query_res[0]._id; // TODO check this result
};

exports.get_topic_id = get_topic_id;

/**
 * @see Algorithm based on: https://www.electricmonk.nl/docs/dependency_resolving_algorithm/dependency_resolving_algorithm.pdf
 *
 * @throws Assert exception if circular dependency detected
 */
let circular_dependency_detector = async (topic_name, new_dependencies) => {
    // Get DB
    let topics_db_model = database.topics_model();

    let all_topics = await topics_db_model.find({}).exec();

    function find_topic_by_name(topics_list, topic_name) {
        return all_topics.find(topic => topic.name === topic_name);
    }

    function is_topic_name_exists(topic_names_list, topic_name) {
        return typeof topic_names_list.find(name => name === topic_name) != "undefined";
    }

    /**
     * @throws Assert exception if circular dependency detected
     *
     * @param topic - Full topic data (name, dependencies_topics)
     * @param resolved - Fully check topics
     * @param seen -At first send []
     */
    function check_dependencies(topic, resolved, seen) {
        seen.push(topic.name);
        if (topic.name === topic_name)
            topic.dependencies_topics = new_dependencies;
        for (let i = 0; i < topic.dependencies_topics.length; i++) {
            let current_dependency = find_topic_by_name(all_topics, topic.dependencies_topics[i]);
            if (!is_topic_name_exists(resolved, current_dependency.name)) {
                assert.ok(!is_topic_name_exists(seen, current_dependency.name), "Circular dependency in topics list detected.");
                check_dependencies(current_dependency, resolved, seen);
            }
        }
        resolved.push(topic.name);
    }

    let resolved = [];
    all_topics.forEach(topic => {
        if (!is_topic_name_exists(resolved, topic.name)) {
            check_dependencies(topic, resolved, []);
        }
    })
};


// API

exports.get = async (req, res, next) => {
    // Get DB
    let topics_db_model = database.topics_model();

    // Get params
    let target_topic_name, target_topic_id;
    target_topic_name = requests_handler.optional_param(req, "route","topic_name");
    target_topic_id = requests_handler.optional_param(req, "route","topic_id");

    // Prepare query
    let query;
    if (target_topic_name) {
        // Validation
        let req = {query: {}};
        req.query.topic_name = target_topic_name;
        assert.ok(await is_topic_exists(req, {}, {}), "Topic not found.");

        // Prepare query
        query = {name: target_topic_name};
    } else if (target_topic_id) {
        // Validation
        let req = {query: {}};
        req.query.topic_id = target_topic_id;
        assert.ok(await is_topic_exists(req, {}, {}), "Topic not found.");

        // Prepare query
        query = {_id: target_topic_id};
    } else {
        // Prepare query
        query = {};
    }

    if (!req.session.user || req.session.user.role < access_limitations.min_access_required.view_archived_topics)
        query.is_active = true;

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
    assert.equal(topic_exists, false, "Topic already exists"); // If exists, throw error

    // Get params
    let topic_description =     requests_handler.require_param(req, "post", "description");
    let topic_dependencies =    requests_handler.optional_param(req, "post", "dependencies");
    let topic_active_status =   requests_handler.optional_param(req, "post", "active_status");

    // Arrange data
    let data = {
        name: target_topic,
        description: topic_description
    };

    requests_handler.validate_and_set_array_optional_input(topic_dependencies, data, "dependencies_topics");
    if (req.session.user.role >= access_limitations.min_access_required.archive_topics)
        requests_handler.validate_and_set_basic_optional_input(topic_active_status, data, "is_active");

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

    // Pre Validation
    let topic_exists = await is_topic_exists({ query: { topic_name: target_topic } });
    assert.ok(topic_exists, "Topic not found."); // If not exists, throw error

    // Get params
    let new_topic_name =            requests_handler.optional_param(req, "post", "new_topic_name");
    let new_topic_description =     requests_handler.optional_param(req, "post", "new_topic_description");
    let new_topic_dependencies =    requests_handler.optional_param(req, "post", "new_topic_dependencies");
    let new_topic_active_status =   requests_handler.optional_param(req, "post", "new_topic_active_status");

    // Arrange new data
    let data = {};
    requests_handler.validate_and_set_basic_optional_input(new_topic_name, data, "name");
    requests_handler.validate_and_set_basic_optional_input(new_topic_description, data, "description");
    requests_handler.validate_and_set_array_optional_input(new_topic_dependencies, data, "dependencies_topics");
    if (data.dependencies_topics) {
        // Circular dependency validator
        await circular_dependency_detector(target_topic, data.dependencies_topics);
    }

    if (req.session.user.role >= access_limitations.min_access_required.archive_topics)
        requests_handler.validate_and_set_basic_optional_input(new_topic_active_status, data, "is_active");

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
    assert.equal(new_topic.ok, true, "Target topic update failed.");

    return new_topic;
};

exports.remove = async (req, res, next) => {
    // Get DB
    let topics_db_model = database.topics_model();

    // Get params
    let target_topic = requests_handler.optional_param(req, "route","topic_name");

    // Validation
    let topic_exists = await is_topic_exists({ query: { topic_name: target_topic } });
    assert.ok(topic_exists, "Topic not found."); // If not exists, throw error

    // Perform action
    return topics_db_model.remove({name: target_topic}).exec();

    // TODO delete as well all topic related tasks
};