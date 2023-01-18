const {checkUpdateFileLinkFormat} = require("../../helper/format");
const {updateFileLink} = require("../../database/api");

function format(req, res, next) {
    if (!checkUpdateFileLinkFormat(req.body)) {
        res.status(400).json({
            "startTime": "Date",
            "endTime": "Date",
            "fileID": "String"
        })
        return;
    }
    next();
}

async function response(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(200).json(await updateFileLink(req.body, req.headers.apiKey));
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
