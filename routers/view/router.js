var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');
const access_limitations = require('../../helpers/configurations/access_limitations');

// Get routs
let connections_routes = require('./connections');

router.get('/', (req, res) => res.redirect('/view/plans'));

router.use('/', connections_routes);

module.exports = router;