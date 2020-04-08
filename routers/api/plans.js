let express = require('express');
let router = express.Router();
const plans_controller = require("../../controllers/plans");
const con_validator = require('../../middlewares/validate_connection');
const access_limitations = require('../../helpers/configurations/access_limitations');

router.get("/", plans_controller.get_plans);

router.get("/p:plan_name", plans_controller.get_plan);

router.post("/create/:plan_name", (req, res, next) => { // Create plan
    req.required_level = access_limitations.min_access_required.create_plans;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, plans_controller.create);

router.post("/modify/:plan_name", (req, res, next) => { // Modify plan
    req.required_level = access_limitations.min_access_required.modify_plans;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, plans_controller.modify);

router.post("/remove/:plan_name", (req, res, next) => { // Delete plan
    req.required_level = access_limitations.min_access_required.delete_plans;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, plans_controller.remove);

module.exports = router;