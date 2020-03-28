const hash = require('../helpers/hash').get_hash_code;
const moment = require('moment');
const assert = require('assert');

let database = require('../helpers/db_controllers/services/db').getDB();
let requests_handler = require('../helpers/requests_handler');
const access_limitations = require('../helpers/configurations/access_limitations');

// req["params"]["username"]
// Return: true if exists, else: false
let is_user_exists = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.require_param(req, "route", "username");
    return (await users_db_model.find({username: username}).exec()).length !== 0;
};

/**
 * @description The function validate that the modify or deletion won't cause the lost of admin permission in the system.
 * False - Role modification / User deletion is allowed.
 * True - Don't modify the role, and don't delete this last admin user.

 * @param username - The user name to apply the action on
 * @param action - ["Delete", "Update"]
 * @param new_role - In case of "Update" action, the new target role.
 *
 * @note This function doesn't check for user existence.
 *
 * @returns {Promise<boolean>}
 */
let last_admin_user_validation = async (username, action, new_role) => {
    let ans = false;
    let admin_role_number = 3; // TODO place it in generic place
    if (action.toLowerCase() === "delete" || Number(new_role) !== admin_role_number) { // Not admin
        let users_db_model = database.users_model();
        let query, res;

        // Check target user role.
        query = {
            username: username
        };
        res = await users_db_model.find(query, 'role').exec();
        if (res[0]._doc.role === admin_role_number) { // If target user role is admin
            query = {
                role: admin_role_number
            };
            res = await users_db_model.find(query, 'username').exec();
            if (res.length === 1) { // This is the last admin in the system
                ans = true;
            }
        }
    }
    return ans;
};

exports.get = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.optional_param(req, "route", "username");
    if (req.user && req.user.role < access_limitations.min_access_required.view_users_details && req.user.username !== username) {
        throw new Error("You have no permission to watch this user.");
    }
    /* Assumptions here:
    *   1. The user might be logged in OR logged out.
    *
    *   2. If the user is logged in:
    *   2.1. The user have an access to view all the users.
    *   2.2. The user requested to view his self profile.
    * */
    let query = {};
    if (username) { // Get specific user by id
        query.username = username;
        if (!req.user) { // [For login / self profile view actions] If not logged in already OR the current user is not an admin, require password
            let password = requests_handler.require_param(req, "get", "password");
            query.password = hash(password);
        }
    } else { /* Get all users */ }
    return users_db_model.find(query, '-password').exec();
};

exports.add = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.require_param(req, "post", "username");
    let password = requests_handler.require_param(req, "post", "password");
    let role = requests_handler.optional_param(req, "post", "role");

    let user_exists = await is_user_exists({ params: { username: username } });

    assert.ok(!user_exists, "User already exists"); // If exists, throw error

    let new_user;
    if (req.user && req.user.role >= access_limitations.min_access_required.create_new_user_with_specific_role && role) {
        new_user = new users_db_model({
            username: username,
            password: hash(password),
            role: role
        });
    } else {
        new_user = new users_db_model({
            username: username,
            password: hash(password)
        });
    }

    new_user = await new_user.save();
    return new_user;
};

exports.modify = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.require_param(req, "route", "username");
    let current_password = requests_handler.optional_param(req, "post", "current_password");
    // TODO add a validation password for the current logged in user
    let new_username = requests_handler.optional_param(req, "post", "username");
    let new_password = requests_handler.optional_param(req, "post", "password");
    let new_role = requests_handler.optional_param(req, "post", "role");

    let update_struct = {};
    if (new_username)
        update_struct.username = new_username;
    if (new_password)
        update_struct.password = hash(new_password);
    if (new_role)
        update_struct.role = new_role;

    let filter = {username: username};
    let update = { $set: update_struct };
    if (current_password) {
        filter.password = hash(current_password);
        delete update.$set.role;
    }

    let user_exists = await is_user_exists({ params: filter });
    assert.ok(user_exists, "User not found"); // If not exists, throw error

    let last_admin_validation = await last_admin_user_validation(username, "Modify", new_role);
    assert.ok(!last_admin_validation, "Attention! This is the last admin user. You can't modify it's role or you won't be able to access as admin anymore."); // If last admin will be lost, throw error

    return users_db_model.updateOne(filter, update, {
        new: true // Return the new object after the update is applied
    }).exec();
};

exports.remove = async (req, res, next) => {
    let users_db_model = database.users_model();
    let username = requests_handler.require_param(req, "route", "username");

    let user_exists = await is_user_exists({ params: { username: username} });

    assert.ok(user_exists, "User not found"); // If not exists, throw error

    let last_admin_validation = await last_admin_user_validation(username, "Delete");
    assert.ok(!last_admin_validation, "Attention! This is the last admin user. You can't delete this user or you won't be able to access as admin anymore."); // If last admin will be lost, throw error

    return users_db_model.remove({username: username}).exec();
};

exports.validate_username = is_user_exists;