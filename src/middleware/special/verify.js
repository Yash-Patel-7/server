const {authAPIKey, authOTP, authUser, updateCurrentUploadSizeBytes} = require("../../database/security");

async function login(req, res, next) {
    return new Promise(async (resolve, reject) => {
        try {
            if (req.headers.apiKey === undefined) {
                res.status(401).json({
                    "authorization": "bearer [apiKey]"
                });
                resolve();
                return;
            }
            if (!(await authAPIKey(req.headers.apiKey))) {
                res.status(401).json({
                    "apiKey": "INVALID"
                });
                resolve();
                return;
            }
            resolve();
            next();
        } catch (e) {
            reject(new Error("could not verify login. Reason: " + e));
        }
    })
}

async function email(req, res, next) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!(await authUser(req.query.unauthID))) {
                res.redirect("/signup");
                resolve();
                return;
            }
            resolve();
            next();
        } catch (e) {
            reject(new Error("could not verify email. Reason: " + e));
        }
    })
}

async function otp(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            res.status(200).json(await authOTP(req.body, req.headers.apiKey));
            resolve();
        } catch (e) {
            reject(new Error("could not verify otp. Reason: " + e));
        }
    })
}

async function totalFileSizeBytes(req, res, next) {
    return new Promise(async (resolve, reject) => {
        try {
            let apiKey = req.headers.apiKey;
            let totalFileSizeByte = req.headers.totalFileSizeBytes;
            if (totalFileSizeByte === undefined) {
                res.status(400).json({
                    "total-file-size-bytes": "Number < 5000000000"
                })
                resolve();
                return;
            }
            if (totalFileSizeByte > 5000000000) {
                res.status(400).json({
                    "total-file-size-bytes": "Number < 5000000000"
                })
                resolve();
                return;
            }
            let availableStorage = await updateCurrentUploadSizeBytes(apiKey, totalFileSizeByte, false);
            if (availableStorage !== true) {
                res.status(400).json(availableStorage);
                resolve();
                return;
            }
            resolve();
            next();
        } catch (e) {
            reject(new Error("could not check total file size in bytes. Reason: " + e));
        }
    })
}

module.exports = {
    login,
    email,
    otp,
    totalFileSizeBytes
}

