var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');
const users_controller = require("../../controllers/users");

// GET routes

router.get('/:username/profile', users_controller.view_profile);

// View all plans that the user is register to
router.get('/:username/profile/plans', users_controller.view_user_active_plans_page);

module.exports = router;