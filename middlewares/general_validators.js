let requests_handler = require('../helpers/requests_handler');
const hash = require('../helpers/hash').get_hash_code;
let database = require('../helpers/db_controllers/services/db').getDB();

// req["condition"]
// req["action_on_reject"] -- Optional
let require_condition = (req, res, next) => {
    if (!req.condition) {
        req.action_on_reject ? req.action_on_reject() : res.status(401).end();
    } else {
        next();
    }
};

module.exports = {
    require_condition
};