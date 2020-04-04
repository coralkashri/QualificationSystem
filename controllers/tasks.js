const hash = require('../helpers/hash').get_hash_code;
const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
let tasks_model = require('../models/tasks');
const access_limitations = require('../helpers/configurations/access_limitations');

// API

exports.get_tasks = async (req, res, next) => {
    try {
        let tasks = await tasks_model.get(req, res, next);
        return responses_gen.generate_response(res, 200, tasks, "Tasks successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.get_task = async (req, res, next) => {
    try {
        let task = await tasks_model.get(req, res, next);
        return responses_gen.generate_response(res, 200, task, "Task successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.create = async (req, res, next) => {
    try {
        let task = await tasks_model.create(req, res, next);
        return responses_gen.generate_response(res, 200, task, "Task successfully created");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.modify = async (req, res, next) => {
    try {
        let task = await tasks_model.modify(req, res, next);
        return responses_gen.generate_response(res, 200, task, "Task successfully modified");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.remove = async (req, res, next) => {
    try {
        let result = await tasks_model.remove(req, res, next);
        return responses_gen.generate_response(res, 200, null, "Task successfully removed");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};