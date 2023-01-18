const {deleteUser} = require("../../database/api");

async function response(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(200).json(await deleteUser(req.headers.apiKey));
            resolve();

        } catch (e) {
            reject(new Error("could not send response. Reason: " + e));
        }
    })
}

module.exports = {
    response
}

