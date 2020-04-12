let express = require('express');
let router = express.Router();
const uploads_controller = require("../../controllers/uploads");
const con_validator = require('../../middlewares/validate_connection');
const access_limitations = require('../../helpers/configurations/access_limitations');
const path = require('path');

// Set Storage
const multer = require("multer");
const storage = multer.diskStorage({
    destination: "./helpers/db_controllers/uploads/",
    filename: function (req, file, callback) {
        let ext_name = path.extname(file.originalname);
        callback(null, path.basename(file.originalname, ext_name) + '-' + Date.now() + ext_name);
    }
});
const upload = multer({ storage : storage});


router.post("/upload", (req, res, next) => { // Create topic
    req.required_level = access_limitations.min_access_required.upload_files;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, upload.array('files_to_upload', 100), uploads_controller.upload_files);

router.post("/delete", (req, res, next) => { // Create topic
    req.required_level = access_limitations.min_access_required.upload_files;
    req.action_on_reject = _ => {
        res.redirect('/403');
    };
    next();
}, con_validator.require_access_level, uploads_controller.delete_files);

module.exports = router;