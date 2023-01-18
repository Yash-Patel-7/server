const {stringify} = require('./generate');
const {getUserTier} = require("../database/security");

function checkCreateUserFormat(body) {
    const userName = Object(body.userName) instanceof String;
    const userEmail = Object(body.userEmail) instanceof String;
    const userPassword = Object(body.userPassword) instanceof String;
    const keys = Object.keys(body);
    const formatKeys = ["userName", "userEmail", "userPassword"];
    const nothingElse = formatKeys.every(e => keys.includes(e)) && keys.every(e => formatKeys.includes(e));
    const correct = userName && userEmail && userPassword && nothingElse;
    if (correct) {
        body.userName = stringify(body.userName);
        body.userEmail = stringify(body.userEmail);
        body.userPassword = stringify(body.userPassword);
    }
    return correct;
}

function checkUpdateUserFormat(body) {
    const userName = Object(body.userName) instanceof String;
    const keys = Object.keys(body);
    const formatKeys = [
        "userName"
    ];
    const nothingElse = formatKeys.every(e => keys.includes(e)) && keys.every(e => formatKeys.includes(e));
    const correct = userName && nothingElse;
    if (correct) {
        body.userName = stringify(body.userName);
    }
    return correct;
}

function checkUnauthID(query) {
    const unauthID = Object(query.unauthID) instanceof String;
    if (unauthID) {
        query.unauthID = stringify(query.unauthID);
    }
    return unauthID;
}

function checkLoginFormat(body) {
    const userEmail = Object(body.userEmail) instanceof String;
    const userPassword = Object(body.userPassword) instanceof String;
    const keys = Object.keys(body);
    const formatKeys = ["userEmail", "userPassword"];
    const nothingElse = formatKeys.every(e => keys.includes(e)) && keys.every(e => formatKeys.includes(e));
    const correct = userEmail && userPassword && nothingElse;
    if (correct) {
        body.userEmail = stringify(body.userEmail);
        body.userPassword = stringify(body.userPassword);
    }
    return correct;
}

function checkOTPFormat(body) {
    const authID = Object(body.authID) instanceof String;
    const otp = Object(body.otp) instanceof String;
    const keys = Object.keys(body);
    const formatKeys = ["authID", "otp"];
    const nothingElse = formatKeys.every(e => keys.includes(e)) && keys.every(e => formatKeys.includes(e));
    const correct = authID && otp && nothingElse;
    if (correct) {
        body.authID = stringify(body.authID);
        body.otp = stringify(body.otp);
    }
    return correct;
}

function checkCreateFileLinkFormat(body, apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            const startTime = Object(body.startTime) instanceof Date;
            const endTime = Object(body.endTime) instanceof Date;
            const onlyOneTimeAccess = Object(body.onlyOneTimeAccess) instanceof Boolean;
            const filePassword = Object(body.filePassword) instanceof String;
            const fileName = Object(body.fileName) instanceof String;
            const keys = Object.keys(body);
            const premiumKeys = [
                "startTime",
                "endTime",
                "onlyOneTimeAccess",
                "filePassword",
                "fileName"
            ];
            const freeKeys = [
                "filePassword",
                "fileName"
            ];
            const premiumNothingElse = premiumKeys.every(e => keys.includes(e)) && keys.every(e => premiumKeys.includes(e));
            const freeNothingElse = freeKeys.every(e => keys.includes(e)) && keys.every(e => freeKeys.includes(e));
            const premiumUser = startTime &&
                endTime &&
                onlyOneTimeAccess &&
                filePassword &&
                fileName &&
                premiumNothingElse;
            const freeUser = filePassword &&
                fileName &&
                freeNothingElse;
            if (premiumUser) {
                body.startTime = stringify(body.startTime);
                body.endTime = stringify(body.endTime);
                body.onlyOneTimeAccess = stringify(body.onlyOneTimeAccess);
                body.filePassword = stringify(body.filePassword);
                body.fileName = stringify(body.fileName);
            } else if (freeUser) {
                body.filePassword = stringify(body.filePassword);
                body.fileName = stringify(body.fileName);
            }
            let tier = await getUserTier(apiKey);
            if (freeUser ^ premiumUser) {
                if (tier.isPremium === true && premiumUser) {
                    resolve({
                        "valid": true,
                        "isPremium": true
                    });
                    return;
                } else if (tier.isPremium === false && freeUser) {
                    resolve({
                        "valid": true,
                        "isPremium": false
                    });
                    return;
                }
            }
            resolve({
                "valid": false,
                "isPremium": tier.isPremium
            });
        } catch (e) {
            reject(new Error("could not check create file link format. Reason: " + e));
        }
    })
}

function checkUpdateFileLinkFormat(body) {
    const startTime = Object(body.startTime) instanceof Date;
    const endTime = Object(body.endTime) instanceof Date;
    const fileID = Object(body.fileID) instanceof String;
    let startBeforeEnd = false;
    if (startTime && endTime) {
        startBeforeEnd = startTime.valueOf() < endTime.valueOf();
    }
    const keys = Object.keys(body);
    const formatKeys = [
        "startTime",
        "endTime",
        "fileID"
    ];
    if (fileID) {
        body.fileID = stringify(body.fileID);
    }
    const nothingElse = formatKeys.every(e => keys.includes(e)) && keys.every(e => formatKeys.includes(e));
    return startTime && endTime && startBeforeEnd && fileID && nothingElse;
}

function checkDeleteFileLinkFormat(body) {
    const fileID = Object(body.fileID) instanceof String;
    const keys = Object.keys(body);
    const formatKeys = [
        "fileID"
    ];
    if (fileID) {
        body.fileID = stringify(body.fileID);
    }
    const nothingElse = formatKeys.every(e => keys.includes(e)) && keys.every(e => formatKeys.includes(e));
    return fileID && nothingElse;
}

module.exports = {
    checkCreateUserFormat,
    checkUpdateUserFormat,
    checkUnauthID,
    checkLoginFormat,
    checkOTPFormat,
    checkCreateFileLinkFormat,
    checkUpdateFileLinkFormat,
    checkDeleteFileLinkFormat
};
