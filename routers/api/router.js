var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');

let connections = require('./connections');

// router.get('/', (req, res) => res.redirect('/api/versions'));

router.use('/', connections);

module.exports = router;