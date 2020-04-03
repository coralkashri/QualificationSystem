var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');
const plans_validator = require('../../middlewares/plans');
const plans_controller = require("../../controllers/plans");
const access_limitations = require('../../helpers/configurations/access_limitations');
const requests_handler = require('../../helpers/requests_handler');

// GET routes

router.get('/', con_validator.require_login, plans_controller.view_plans_page);

router.get('/plan-:plan_name', con_validator.require_login, async (req, res, next) => {
    let plan_name = requests_handler.require_param(req, "route", "plan_name");
    req.condition = await plans_controller.is_user_registered_to_plan(req.session.user.username, plan_name);
    req.action_on_reject = _ => {
        res.redirect('/view/plans');
    };
    next();
}, plans_validator.require_condition, plans_controller.view_plan_page);



module.exports = router;