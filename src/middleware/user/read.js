const {readUser} = require("../../database/api");

async function response(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(200).json(await readUser(req.headers.apiKey));
            resolve();

        } catch (e) {
            reject(new Error("could not send response. Reason: " + e));
        }
    })
}

module.exports = {
    response
}

