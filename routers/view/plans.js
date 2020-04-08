var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');
const general_middleware_validators = require('../../middlewares/general_validators');
const plans_controller = require("../../controllers/plans");
const users_controller = require("../../controllers/users");
const access_limitations = require('../../helpers/configurations/access_limitations');
const requests_handler = require('../../helpers/requests_handler');

// GET routes

router.get('/', con_validator.require_login, plans_controller.view_plans_page);

router.get('/:plan_name', con_validator.require_login, plans_controller.view_plan_page);

module.exports = router;