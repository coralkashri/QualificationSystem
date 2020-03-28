let express = require('express');
let router = express.Router();
const connections_controller = require("../../controllers/connections");
const con_validator = require('../../middlewares/validate_connection');

router.get("/login/:username", con_validator.require_logout, connections_controller.login); // Validate login

router.post("/register", con_validator.require_logout, connections_controller.register); // Validate login

module.exports = router;