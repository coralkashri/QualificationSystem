let express = require('express');
let router = express.Router();
const topics_controller = require("../../controllers/topics");
const con_validator = require('../../middlewares/validate_connection');
const access_limitations = require('../../helpers/configurations/access_limitations');

router.get("/", con_validator.require_login, topics_controller.get_topics);

router.get("/t:topic_name", con_validator.require_login, topics_controller.get_topic);

router.post("/create/:topic_name", con_validator.require_login, (req, res, next) => { // Create topic
    req.required_level = access_limitations.min_access_required.create_topic;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, topics_controller.create);

router.post("/modify/:topic_name", con_validator.require_login, (req, res, next) => { // Modify topic
    req.required_level = access_limitations.min_access_required.modify_topic;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, topics_controller.modify);

router.post("/remove/:topic_name", con_validator.require_login, (req, res, next) => { // Delete topic
    req.required_level = access_limitations.min_access_required.delete_topic;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, topics_controller.remove);

module.exports = router;