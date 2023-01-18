const {deleteFileLink} = require("../../database/api");
const {checkDeleteFileLinkFormat} = require("../../helper/format");

function format(req, res, next) {
    if (!checkDeleteFileLinkFormat(req.body)) {
        res.status(400).json({
            "fileID": "String"
        })
        return;
    }
    next();
}

async function response(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(200).json(await deleteFileLink(req.headers.apiKey, req.body.fileID));
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
