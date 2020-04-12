const assert = require('assert');

/**
 *
 * @param req
 * @param param_type - Options: {post, get, route}
 * @param param_name
 * @returns {*}
 */
exports.require_param = (req, param_type, param_name) => {
    switch (param_type) {
        case "post": param_type = "body"; break;
        case "get": param_type = "query"; break;
        case "route": param_type = "params"; break;
    }
    const value = req[param_type][param_name];
    assert.notEqual(value, undefined, "Missing " + param_name + " param.");
    return value;
};

/**
 *
 * @param req
 * @param param_type - Options: {post, get, route}
 * @param param_name
 * @returns {*}
 */
exports.optional_param = (req, param_type, param_name) => {
    switch (param_type) {
        case "post": param_type = "body"; break;
        case "get": param_type = "query"; break;
        case "route": param_type = "params"; break;
    }
    return req[param_type][param_name];
};

let validate_basic_input = (input) => {
    return typeof input != "undefined";
};

exports.validate_basic_input = validate_basic_input;

exports.validate_and_set_basic_optional_input = (input, dst_obj, prop) => {
    if (validate_basic_input(input)) dst_obj[prop] = input;
};

exports.validate_and_set_array_optional_input = (input, dst_obj, prop) => {
    if (validate_basic_input(input)) {
        input = input && JSON.parse(input);
        dst_obj[prop] = input || [];
    }
};