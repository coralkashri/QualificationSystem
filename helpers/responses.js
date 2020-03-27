exports.generate_response = (res, status, data, msg) => {
    res.status(status).json({ status: status, data: data, message: msg });
};