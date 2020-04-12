var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');
const users_controller = require("../../controllers/users");
const admin_controller = require("../../controllers/admin");
const access_limitations = require('../../helpers/configurations/access_limitations');

// GET routes

router.get("/", (req, res) => res.redirect("/view/admin-panel/index"));

router.get("/:category_name", admin_controller.view_admin_panel);


// Users
router.get("/users-management/u:username", admin_controller.view_user_management_panel);

router.get("/users-management/new-user", admin_controller.view_user_management_panel);


// Plans
router.get("/plans-management/p:plan_name", admin_controller.view_plans_management_page);

router.get("/plans-management/new-plan", admin_controller.view_plans_management_page);


// Topics
router.get("/topics-management/t:topic_name", admin_controller.view_topics_management_page);

router.get("/topics-management/new-topic", admin_controller.view_topics_management_page);


// Tasks
router.get("/tasks-management/t:task_id", admin_controller.view_tasks_management_page);

router.get("/tasks-management/new-task", admin_controller.view_tasks_management_page);

module.exports = router;