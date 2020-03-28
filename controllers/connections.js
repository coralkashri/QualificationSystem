const hash = require('../helpers/hash').get_hash_code;
const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
let users_model = require('../models/users');
const access_limitations = require('../helpers/configurations/access_limitations');

exports.login = async (req, res, next) => {
    try {
        let user = await users_model.get(req, res, next); // by username & password
        if (user.length !== 0) {
            user = user[0];
            if (hash(req.query.password) === user.password) { // Single hash comparison
                // sets a cookie with the user's info
                user.password = hash(user.password);
                req.session.user = user;
                return responses_gen.generate_response(res, 200, user, "Successful login");
            }
        }
        throw new Error("Credentials don't much an existing user.");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.register = async (req, res, next) => {
    try {
        req["body"]["role"] = undefined;
        let user = await users_model.add(req, res, next); // Without a specified role -> In model set role to default (Guest)
        return responses_gen.generate_response(res, 200, user, "User successfully restored");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};


// View

exports.view_login_page = async (req, res, next) => {
    try {
        res.render("pages/login", {
            access_level: req.session.user ? req.session.user.role : 1,
            is_logged_in: !!req.session.user,
            username: req.session.user && req.session.user.username,
            min_access_required: access_limitations.min_access_required
        });
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};