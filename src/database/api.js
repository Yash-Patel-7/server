const {generateSHA256Hash, generateAPIKey, generateAWSKey} = require("../helper/generate");
const {getSealGuardianDB} = require("./connection");
const {getUserTier} = require("./security");
const {sendAuthorizationEmail} = require("../helper/email");
const {validate} = require("deep-email-validator");

async function createUser(document) {
    return new Promise(async (resolve, reject) => {
        try {
            let validateEmail = await validate({
                email: document.userEmail,
                validateRegex: true,
                validateMx: true,
                validateTypo: true,
                validateDisposable: true,
                validateSMTP: false,
            });
            if (!validateEmail.valid) {
                resolve({
                    "errorMessage": "INVALID EMAIL"
                });
                return;
            }
            document.unauthID = await generateAPIKey();
            let unauthDoc = {
                "userName": document.userName,
                "userEmail": document.userEmail,
                "userPassword": generateSHA256Hash(document.userPassword),
                "birthDate": new Date(),
                "unauthID": document.unauthID,
                "age": 0
            }
            let filterExist = {
                "userEmail": document.userEmail
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('unauth');
            const cursor = coll.find(filterExist);
            const result = await cursor.toArray();
            const collAuth = db.collection("auth");
            const cursorAuth = collAuth.find(filterExist);
            const resultAuth = await cursorAuth.toArray();
            if (result.length === 1) {
                resolve({
                    "errorMessage": "AUTHORIZE EMAIL"
                });
                return;
            }
            if (resultAuth.length === 1) {
                resolve({
                    "errorMessage": "USER ALREADY EXISTS"
                });
                return;
            }
            await coll.insertOne(unauthDoc);
            await sendAuthorizationEmail(document);
            resolve({
                "CREATE": "SUCCESS"
            });

        } catch (e) {
            reject(new Error("could not create user. Reason: " + e));
        }
    })
}

async function readUser(apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let db = await getSealGuardianDB();
            const coll = db.collection('user');
            const cursor = coll.find(filter);
            const result = await cursor.toArray();
            if (result.length === 0) {
                resolve({
                    "errorMessage": "USER DOES NOT EXIST"
                });
                return;
            }
            resolve(result[0]);

        } catch (e) {
            reject(new Error("could not read user. Reason: " + e));
        }
    })
}

async function updateUser(document, apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let set = {
                "$set": document
            }
            let db = await getSealGuardianDB();
            const coll = db.collection('user');
            await coll.updateOne(filter, set);
            resolve({
                "UPDATE": "SUCCESS"
            });

        } catch (e) {
            reject(new Error("could not update user. Reason: " + e));
        }
    })
}

async function deleteUser(apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('auth');
            await coll.deleteOne(filter);
            coll = db.collection('user');
            await coll.deleteOne(filter);
            coll = db.collection('fileLink');
            await coll.deleteMany(filter);
            resolve({
                "DELETE": "SUCCESS"
            });

        } catch (e) {
            reject(new Error("could not delete user. Reason: " + e));
        }
    })
}

async function logoutUser(apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let set = {
                "$set": {
                    "isLoggedIn": false
                }
            }
            let db = await getSealGuardianDB();
            const coll = db.collection('auth');
            await coll.updateOne(filter, set);
            resolve({
                "LOGOUT": "SUCCESS"
            });
        } catch (e) {
            reject(new Error("could not logout user. Reason: " + e));
        }
    })
}

async function createFileLink(document, apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let currentDate = new Date();
            let awsKey = generateAWSKey(document.fileName, currentDate);
            let userTier = await getUserTier(apiKey);
            let premiumDoc = undefined;
            let freeDoc = undefined;
            if (userTier.isPremium) {
                premiumDoc = {
                    "apiKey": apiKey,
                    "isPremium": true,
                    "numOfFailedAttempts": 0,
                    "numOfSuccessAttempts": 0,
                    "activeStatus": true,
                    "startTime": document.startTime,
                    "endTime": document.endTime,
                    "isFirstAccess": true,
                    "onlyOneTimeAccess": document.onlyOneTimeAccess,
                    "filePassword": generateSHA256Hash(document.filePassword),
                    "fileName": document.fileName,
                    "birthDate": currentDate,
                    "firstAccessTime": currentDate,
                    "awsKey": awsKey,
                    "fileID": await generateAPIKey(),
                    "age": 0
                }
            } else {
                freeDoc = {
                    "apiKey": apiKey,
                    "isPremium": false,
                    "numOfFailedAttempts": 0,
                    "numOfSuccessAttempts": 0,
                    "activeStatus": true,
                    "startTime": new Date(0),
                    "endTime": new Date(0),
                    "isFirstAccess": true,
                    "onlyOneTimeAccess": false,
                    "filePassword": generateSHA256Hash(document.filePassword),
                    "fileName": document.fileName,
                    "birthDate": currentDate,
                    "firstAccessTime": currentDate,
                    "awsKey": awsKey,
                    "fileID": await generateAPIKey(),
                    "age": 0
                }
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('fileLink');
            if (userTier.isPremium) {
                await coll.insertOne(premiumDoc);
            } else {
                await coll.insertOne(freeDoc);
            }
            resolve({
                "awsKey": awsKey
            })

        } catch (e) {
            reject(new Error("could not create file link. Reason: " + e));
        }
    })
}

async function readFileLink(apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let db = await getSealGuardianDB();
            const coll = db.collection('fileLink');
            const cursor = coll.find(filter);
            const result = await cursor.toArray();
            resolve(result);
        } catch (e) {
            reject(new Error("could not read file link. Reason: " + e));
        }
    })
}

async function updateFileLink(document, apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey,
                "fileID": document.fileID
            }
            delete document['fileID'];
            let set = {
                "$set": document
            }
            let db = await getSealGuardianDB();
            const coll = db.collection('fileLink');
            await coll.updateOne(filter, set);
            resolve({
                "UPDATE": "SUCCESS"
            });
        } catch (e) {
            reject(new Error("could not update file link. Reason: " + e));
        }
    })
}

async function deleteFileLink(apiKey, fileID) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey,
                "fileID": fileID
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('fileLink');
            await coll.deleteOne(filter);
            resolve({
                "DELETE": "SUCCESS"
            });
        } catch (e) {
            reject(new Error("could not delete file link. Reason: " + e));
        }
    })
}

module.exports = {
    createUser,
    readUser,
    updateUser,
    deleteUser,
    logoutUser,
    createFileLink,
    readFileLink,
    updateFileLink,
    deleteFileLink
}
