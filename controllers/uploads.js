const responses_gen = require('../helpers/responses');
const requests_handler = require('../helpers/requests_handler');
const fs = require("fs");
const uploads_path = "helpers/db_controllers/uploads/";

// API

exports.upload_files = async (req, res, next) => {
    try {
        let file_names = [];
        let files = req.files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                file_names.push(files[i].filename);
            }
        }
        return responses_gen.generate_response(res, 200, file_names, "Files successfully uploaded.");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};

exports.delete_files = async (req, res, next) => {
    try {
        let file_names = requests_handler.require_param(req, "post", "file_names");
        for (let i = 0; i < file_names.length; i++) {
            fs.unlinkSync(uploads_path + file_names[i]);
        }
        return responses_gen.generate_response(res, 200, tasks, "File successfully removed.");
    } catch (e) {
        return responses_gen.generate_response(res, 400, null, e.message);
    }
};