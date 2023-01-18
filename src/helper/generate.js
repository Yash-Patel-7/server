const {randomBytes, createHash} = require('crypto');
const {promisify} = require('util');
const randomBytesAsync = promisify(randomBytes);

async function generateAPIKey() {
    return new Promise(async (resolve, reject) => {
        try {
            const buffer = await randomBytesAsync(21);
            resolve(buffer.toString('hex'));

        } catch (e) {
            reject(new Error("could not generate API Key. Reason: " + e));
        }
    })
}

async function generateOTP() {
    return new Promise(async (resolve, reject) => {
        try {
            const buffer = await randomBytesAsync(3);
            resolve(("" + parseInt(buffer.toString('hex'), 16)).substring(0, 6));

        } catch (e) {
            reject(new Error("could not generate OTP. Reason: " + e));
        }
    })
}

function generateSHA256Hash(str) {
    return createHash('sha256').update(str).digest('hex');
}

function stringify(str) {
    return JSON.stringify(str).slice(1, -1);
}

function generateAWSKey(fileName, currentDate) {
    return fileName + "-" + currentDate.valueOf();
}

module.exports = {
    generateAPIKey,
    generateOTP,
    generateSHA256Hash,
    stringify,
    generateAWSKey
}

