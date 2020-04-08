let express = require('express');
let router = express.Router();
const tasks_controller = require("../../controllers/tasks");
const con_validator = require('../../middlewares/validate_connection');
const access_limitations = require('../../helpers/configurations/access_limitations');

router.get("/", tasks_controller.get_tasks);

router.get("/t:task_id", tasks_controller.get_task);

router.post("/create", (req, res, next) => { // Create topic
    req.required_level = access_limitations.min_access_required.create_tasks;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, tasks_controller.create);

router.post("/modify/:task_id", (req, res, next) => { // Modify topic
    req.required_level = access_limitations.min_access_required.modify_tasks;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, tasks_controller.modify);

router.post("/remove/:task_id", (req, res, next) => { // Delete topic
    req.required_level = access_limitations.min_access_required.delete_tasks;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, tasks_controller.remove);

module.exports = router;