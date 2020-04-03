let express = require('express');
let router = express.Router();
const users_controller = require("../../controllers/users");
const con_validator = require('../../middlewares/validate_connection');
const access_limitations = require('../../helpers/configurations/access_limitations');
let requests_handler = require('../../helpers/requests_handler');

// GET routes

router.get("/", (req, res) => res.redirect('/api/users/all'));

router.get("/all", (req, res, next) => {
    req.required_level = access_limitations.min_access_required.view_users_details;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, users_controller.get_users);

router.get("/u:username", (req, res, next) => {
    req.required_level = access_limitations.min_access_required.view_users_details;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, users_controller.get_user);


// POST routes

router.post("/create", (req, res, next) => {
    req.required_level = access_limitations.min_access_required.create_new_user_with_specific_role;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, users_controller.add_user);

router.post("/modify/:username", (req, res, next) => {
    let current_password = requests_handler.optional_param(req, "post", "current_password");
    if (!current_password) {
        req.required_level = access_limitations.min_access_required.modify_all_users;
    } else {
        req.required_level = access_limitations.min_access_required.modify_current_user;
    }
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, users_controller.modify_user);

router.post("/remove/:username", (req, res, next) => {
    req.required_level = access_limitations.min_access_required.delete_different_users;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, users_controller.remove_user);

module.exports = router;