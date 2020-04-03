const hash = require('../helpers/hash').get_hash_code;
const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
let topics_model = require('../models/topics');
const access_limitations = require('../helpers/configurations/access_limitations');

// API

exports.get_topics = async (req, res, next) => {
    try {
        let topics = await topics_model.get(req, res, next);
        return responses_gen.generate_response(res, 200, topics, "Topics successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.get_topic = async (req, res, next) => {
    try {
        let topic = await topics_model.get(req, res, next);
        return responses_gen.generate_response(res, 200, topic, "Topic successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.create = async (req, res, next) => {
    try {
        let topic = await topics_model.create(req, res, next);
        return responses_gen.generate_response(res, 200, topic, "Topic successfully created");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.modify = async (req, res, next) => {
    try {
        let topic = await topics_model.modify(req, res, next);
        return responses_gen.generate_response(res, 200, topic, "Topic successfully modified");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.remove = async (req, res, next) => {
    try {
        let result = await topics_model.remove(req, res, next);
        return responses_gen.generate_response(res, 200, null, "Topic successfully removed");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};