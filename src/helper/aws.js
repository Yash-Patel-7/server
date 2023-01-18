const aws = require('aws-sdk');
const {S3Client} = require("@aws-sdk/client-s3");
const multer  = require('multer');
const multerS3 = require('multer-s3');

async function config() {
    return new Promise(async (resolve, reject) => {
        try {
            aws.config.update({
                "secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
                "accessKeyId": process.env.AWS_ACCESS_KEY_ID,
                "region": process.env.AWS_REGION
            });
            resolve();
        } catch (e) {
            reject(new Error("could not configure AWS. Reason: " + e));
        }
    })
}

async function uploaderS3(params) {
    return new Promise(async (resolve, reject) => {
        try {
            await config();
            resolve(multer({
                "storage": multerS3({
                    "s3": new S3Client(undefined),
                    "bucket": params.bucket,
                    "key": params.key,
                    "contentType": multerS3.AUTO_CONTENT_TYPE,
                    "contentDisposition": params.contentDisposition,
                    "cacheControl": params.cacheControl,
                    "metadata": params.metadata,
                }),
                "limits": params.limits
            }));
        } catch (e) {
            reject(new Error("could not get uploader to s3. Reason: " + e));
        }
    })
}

module.exports = {
    uploaderS3
}

