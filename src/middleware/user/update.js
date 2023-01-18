const {checkUpdateUserFormat} = require("../../helper/format");
const {updateUser} = require("../../database/api");

function format(req, res, next) {
    if (!checkUpdateUserFormat(req.body)) {
        res.status(400).json({
            "userName": "String"
        })
        return;
    }
    next();
}

async function response(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(200).json(await updateUser(req.body, req.headers.apiKey));
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

