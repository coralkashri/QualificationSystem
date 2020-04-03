var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');
const access_limitations = require('../../helpers/configurations/access_limitations');

// Get routs
let plans_routes = require('./plans');
let system_admin_panel_routes = require('./system_admin_panel');
let connections_routes = require('./connections');

router.get('/', (req, res) => res.redirect('/view/plans'));

router.use('/plans', plans_routes);

router.use('/admin-panel', con_validator.require_login, (req, res, next) => {
    req.required_level = access_limitations.min_access_required.view_admin_panel;
    req.action_on_reject = _ => {
        res.redirect('/404');
    };
    next();
}, con_validator.require_access_level, system_admin_panel_routes);

router.use('/', connections_routes);

module.exports = router;