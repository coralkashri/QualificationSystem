var express = require('express');
var router = express.Router();
const con_validator = require('../../middlewares/validate_connection');
const connections_controller = require("../../controllers/connections");
const access_limitations = require('../../helpers/configurations/access_limitations');

// GET routes

router.get('/login', con_validator.require_logout, connections_controller.view_login_page);

router.get('/disconnect', function(req, res) {
    req.session.reset();
    res.redirect('/');
});

router.get("/register", con_validator.require_logout, function(req, res) {
    res.render('pages/register'); // TODO create register page
});

module.exports = router;