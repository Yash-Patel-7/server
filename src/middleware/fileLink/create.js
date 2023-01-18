const {checkCreateFileLinkFormat} = require("../../helper/format");
const {createFileLink} = require("../../database/api");
const {updateCurrentUploadSizeBytes} = require("../../database/security");
const aws = require("../../helper/aws");
const multer = require("multer");

async function format(req) {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await checkCreateFileLinkFormat(req.body, req.headers.apiKey);
            if (!user.valid) {
                if (user.isPremium === true) {
                    resolve({
                        "startTime": "Date",
                        "endTime": "Date",
                        "onlyOneTimeAccess": "Boolean",
                        "filePassword": "String",
                        "fileName": "String"
                    })
                    return;
                } else {
                    resolve({
                        "filePassword": "String",
                        "fileName": "String"
                    })
                    return;
                }
            }
            resolve(true);
        } catch (e) {
            reject(new Error("could not check fileLink format. Reason: " + e));
        }
    })
}

async function response(req, res, err) {
    return new Promise(async (resolve, reject) => {
        try {
            if (err instanceof multer.MulterError) {
                res.status(400).json({
                    "errorMessage": "UPLOAD FAILED"
                });
                resolve();
                return;
            } else if (err) {
                res.status(400).json(JSON.parse(err.message));
                resolve();
                return;
            }
            res.status(201).json({
                "upload": "SUCCESS"
            })
            resolve();
        } catch (e) {
            reject(new Error("could not send response. Reason: " + e));
        }
    })
}

async function key(req, file, cb) {
    return new Promise(async (resolve, reject) => {
        try {
            const errorMessage = await format(req);
            if (errorMessage !== true) {
                cb(new Error(JSON.stringify(errorMessage)));
                resolve();
                return;
            }
            let apiKey = req.headers.apiKey;
            let totalFileSizeByte = req.headers.totalFileSizeBytes;
            await updateCurrentUploadSizeBytes(apiKey, totalFileSizeByte, true);
            let {awsKey} = await createFileLink(req.body, req.headers.apiKey);
            cb(null, awsKey);
            resolve();
        } catch (e) {
            reject(new Error("could not run key middleware. Reason: " + e));
        }
    })
}

async function upload(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            let params = {
                "bucket": "sealguardian",
                "key": key,
                "contentDisposition": "attachment",
                "cacheControl": "no-store",
                "metadata": (req, file, cb) => cb(null, {"accept-ranges": "none"}),
                "limits": {
                    "fileSize": req.headers.totalFileSizeBytes,
                    "fields": 6
                }
            }
            let uploadS3 = await aws.uploaderS3(params);
            uploadS3.single('file')(req, res, async (err) => {
                await response(req, res, err);
            })
            resolve();
        } catch (e) {
            reject(new Error("could not get uploader S3. Reason: " + e));
        }
    })
}

module.exports = {
    upload
}
