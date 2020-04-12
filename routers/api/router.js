var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');

let plans_routes = require('./plans');
let topics_routes = require('./topics');
let tasks_routes = require('./tasks');
let users_routes = require('./users');
let uploads_routes = require('./uploads');
let connections = require('./connections');

router.use('/', connections);

router.use('/plans', con_validator.require_login, plans_routes);

router.use('/topics', con_validator.require_login, topics_routes);

router.use('/tasks', con_validator.require_login, tasks_routes);

router.use('/users', con_validator.require_login, users_routes);

router.use('/uploads', con_validator.require_login, uploads_routes);

module.exports = router;