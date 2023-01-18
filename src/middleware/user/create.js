const {checkCreateUserFormat} = require("../../helper/format");
const {createUser} = require("../../database/api");

function format(req, res, next) {
    if (!checkCreateUserFormat(req.body)) {
        res.status(400).json({
            "userName": "String",
            "userEmail": "String",
            "userPassword": "String"
        })
        return;
    }
    next();
}

async function response(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(201).json(await createUser(req.body));
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

