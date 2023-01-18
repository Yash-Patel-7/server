const {stringify} = require('../../helper/generate');

async function headers(req, res, next) {
    return new Promise(async (resolve, reject) => {
        try {
            if (req.headers['authorization'] === undefined || req.headers['authorization'].length < 8) {
                req.headers.apiKey = undefined;
            } else {
                req.headers.apiKey = stringify(req.headers['authorization'].slice(7));
            }
            if (req.headers['total-file-size-bytes'] === undefined) {
                req.headers.totalFileSizeBytes = undefined;
                resolve();
                next();
                return;
            }
            if (!(/^\d+$/.test(req.headers['total-file-size-bytes']))) {
                req.headers.totalFileSizeBytes = undefined;
                resolve();
                next();
                return;
            }
            let totalFileSizeByte = parseInt(req.headers['total-file-size-bytes'], 10);
            if (isNaN(totalFileSizeByte)) {
                req.headers.totalFileSizeBytes = undefined;
                resolve();
                next();
                return;
            }
            req.headers.totalFileSizeBytes = totalFileSizeByte;
            resolve();
            next();
        } catch (e) {
            reject(new Error("could not parse headers. Reason: " + e));
        }
    })
}

module.exports = {
    headers
}

