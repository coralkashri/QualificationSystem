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
    //if (value === undefined) throw new Error("Missing " + param_name + " param.");
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