const {checkLoginFormat} = require("../../helper/format");
const {authUserCredentials} = require("../../database/security");

function format(req, res, next) {
    if (!checkLoginFormat(req.body)) {
        res.status(400).json({
            "userEmail": "String",
            "userPassword": "String"
        })
        return;
    }
    next();
}

function response(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(200).json(await authUserCredentials(req.body));
            resolve();

        } catch (e) {
            reject(new Error("could not send response. Reason: " + e));
        }
    })
}

module.exports = {
    format,
    response
}
