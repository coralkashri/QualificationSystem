var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');

let plans_routes = require('./plans');
let topics_routes = require('./topics');
let users_routes = require('./users');
let connections = require('./connections');

router.use('/', connections);

router.use('/plans', plans_routes);

router.use('/topics', topics_routes);

router.use('/users', con_validator.require_login, users_routes);

module.exports = router;