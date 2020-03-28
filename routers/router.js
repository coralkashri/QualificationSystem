var express = require('express');
var router = express.Router();
con_validator = require('../middlewares/validate_connection');

// Get routs
let api_routes      = require('./api/router');
let view_routes     = require('./view/router');

router.get('/', (req, res) => res.redirect('/view'));

router.use('/api', (req, res, next) => { // Required Guest
    req.required_level = 1;
    req.action_on_reject = _ => {
        res.redirect('/banned');
    };
    next();
}, con_validator.require_access_level, api_routes);

router.use('/view', (req, res, next) => { // Required Guest
    req.required_level = 1;
    req.action_on_reject = _ => {
        res.redirect('/banned');
    };
    next();
}, con_validator.require_access_level, view_routes);

module.exports = router;