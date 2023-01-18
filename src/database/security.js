const {getSealGuardianDB} = require("./connection");
const {generateAPIKey, generateOTP, generateSHA256Hash} = require("../helper/generate");
const {sendOTPEmail} = require("../helper/email");

async function authAPIKey(apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('auth');
            let cursor = coll.find(filter);
            let result = await cursor.toArray();
            if (result.length === 1) {
                let auth = result[0];
                if (auth.isLoggedIn && (new Date().valueOf() - auth.loginTime.valueOf() > 86400000)) {
                    auth.isLoggedIn = false;
                    let updateDoc = {
                        "$set": {
                            "isLoggedIn": false
                        }
                    }
                    await coll.updateOne(filter, updateDoc);
                }
                resolve(auth.isLoggedIn);

            } else {
                resolve(false);

            }
        } catch (e) {
            reject(new Error("could not authorize API Key. Reason: " + e));
        }
    })
}

async function authUserCredentials(body) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "userEmail": body.userEmail,
                "userPassword": generateSHA256Hash(body.userPassword)
            }
            let db = await getSealGuardianDB();
            const coll = db.collection('auth');
            const cursor = coll.find(filter);
            const result = await cursor.toArray();
            if (result.length !== 1) {
                resolve({
                    "credentials": "INVALID"
                });
                return;
            }
            let OTP = await updateOTP(result[0].authID);
            await sendOTPEmail({
                "otp": OTP.otp,
                "userEmail": body.userEmail
            })
            resolve({
                "authID": result[0].authID
            });

        } catch (e) {
            reject(new Error("could not authorize user credentials. Reason: " + e));
        }
    })
}

async function authOTP(body, authID) {
    return new Promise(async (resolve, reject) => {
        try {
            let authIDFilter = {
                "authID": authID
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('auth');
            let cursor = coll.find(authIDFilter);
            let result = await cursor.toArray();
            if (result.length !== 1) {
                resolve({
                    "OTP": "INVALID"
                })
                return;
            }
            const authUser = result[0];
            if (authUser.otpTime.valueOf() === 0) {
                resolve({
                    "errorMessage": "ALREADY LOGGED IN"
                })
                return;
            }
            if ((authUser.otp !== body.otp) || (new Date().valueOf() - authUser.otpTime.valueOf() > 600000)) {
                resolve({
                    "OTP": "INVALID"
                })
                return;
            }
            let newAPIKey = await regenerateAPIKey(authUser.apiKey);
            let userFilter = {
                "apiKey": newAPIKey.apiKey
            }
            let updateUserDoc = {
                "$set": {
                    "lastLogin": authUser.loginTime
                }
            }
            coll = db.collection('user');
            await coll.updateOne(userFilter, updateUserDoc);
            let updateDoc = {
                "$set": {
                    "otpTime": new Date(0),
                    "isLoggedIn": true,
                    "loginTime": new Date()
                }
            }
            coll = db.collection('auth');
            await coll.updateOne(authIDFilter, updateDoc);
            resolve({
                "apiKey": newAPIKey.apiKey
            })

        } catch (e) {
            reject(new Error("could not authorize OTP. Reason: " + e));
        }
    });
}

async function regenerateAPIKey(currentAPIKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let newAPIKey = await generateAPIKey();
            let filter = {
                "apiKey": currentAPIKey
            }
            let set = {
                "$set": {
                    "apiKey": newAPIKey
                }
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('auth');
            await coll.updateOne(filter, set);
            coll = db.collection('user');
            await coll.updateOne(filter, set);
            coll = db.collection('fileLink');
            await coll.updateMany(filter, set);
            resolve({
                "apiKey": newAPIKey
            });

        } catch (e) {
            reject(new Error("could not regenerate API key. Reason: " + e));
        }
    })
}

async function updateOTP(authID) {
    return new Promise(async (resolve, reject) => {
        try {
            let OTP = await generateOTP();
            let filter = {
                "authID": authID
            }
            let set = {
                "$set": {
                    "otp": OTP,
                    "otpTime": new Date()
                }
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('auth');
            await coll.updateOne(filter, set);
            resolve({
                "otp": OTP
            });

        } catch (e) {
            reject(new Error("could not update OTP. Reason: " + e));
        }
    })
}

async function deleteExpiredFileLink() {
    return new Promise(async (resolve, reject) => {
        try {
            let pipeline = [
                {
                    "$set": {
                        "age": {
                            "$subtract": [new Date(), "$birthDate"]
                        }
                    }
                }
            ]
            let freeUserFilter = {
                "isPremium": false,
                "age": {
                    "$gt": 86400000
                }
            }
            let premiumUserFilter = {
                "isPremium": true,
                "age": {
                    "$gt": 604800000
                }
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('fileLink');
            await coll.updateMany({}, pipeline);
            await Promise.all([
                coll.deleteMany(freeUserFilter),
                coll.deleteMany(premiumUserFilter)
            ]);
            resolve("finished deleting expired fileLinks on " + new Date().toString());

        } catch (e) {
            reject(new Error("could not delete expired fileLinks. Reason: " + e));
        }
    })
}

async function authUser(unauthID) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "unauthID": unauthID
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('unauth');
            let cursor = coll.find(filter);
            let result = await cursor.toArray();
            if (result.length !== 1) {
                resolve(false);
                return;
            }
            const unauthUser = result[0];
            let apiKey = await generateAPIKey();
            let authID;
            while ((authID = await generateAPIKey()) === apiKey) {}
            let currentDate = new Date();
            let authDoc = {
                "userEmail": unauthUser.userEmail,
                "userPassword": unauthUser.userPassword,
                "otp": await generateOTP(),
                "isLoggedIn": false,
                "apiKey": apiKey,
                "loginTime": currentDate,
                "otpTime": currentDate,
                "authID": authID
            }
            let userDoc = {
                "userName": unauthUser.userName,
                "isPremium": false,
                "userEmail": unauthUser.userEmail,
                "currentUploadSizeBytes": 0,
                "accountBirthDate": currentDate,
                "cycleStartTime": currentDate,
                "apiKey": apiKey,
                "lastLogin": currentDate,
            }
            await coll.deleteOne(filter);
            coll = db.collection('auth');
            await coll.insertOne(authDoc);
            coll = db.collection('user');
            await coll.insertOne(userDoc);
            resolve(true);

        } catch (e) {
            reject(new Error("could not authorize user. Reason: " + e));
        }
    })
}

async function deleteExpiredUnauth() {
    return new Promise(async (resolve, reject) => {
        try {
            let pipeline = [
                {
                    "$set": {
                        "age": {
                            "$subtract": [new Date(), "$birthDate"]
                        }
                    }
                }
            ]
            let filter = {
                "age": {
                    "$gt": 604800000
                }
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('unauth');
            await coll.updateMany({}, pipeline);
            await coll.deleteMany(filter);
            resolve("finished deleting unauth users on " + new Date().toString());

        } catch (e) {
            reject(new Error("could not delete expired unauth users. Reason: " + e));
        }
    });
}

async function getUserTier(apiKey) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('user');
            let cursor = coll.find(filter);
            let result = await cursor.toArray();
            if (result.length !== 1) {
                resolve({
                    "isPremium": undefined
                })
                return;
            }
            resolve({
                "isPremium": result[0].isPremium
            })

        } catch (e) {
            reject(new Error("could not get user tier. Reason: " + e));
        }
    })
}

async function updateCurrentUploadSizeBytes(apiKey, fileSizeBytes, doUpdate) {
    return new Promise(async (resolve, reject) => {
        try {
            let filter = {
                "apiKey": apiKey
            }
            let db = await getSealGuardianDB();
            let coll = db.collection('user');
            let cursor = await coll.find(filter);
            let results = await cursor.toArray();
            let user = results[0];
            if(user.isPremium) {
                if (user.currentUploadSizeBytes + fileSizeBytes > 10000000000) {
                    resolve({
                        "availableUploadBytes": 10000000000 - user.currentUploadSizeBytes
                    });
                    return;
                }
            } else {
                if (user.currentUploadSizeBytes + fileSizeBytes > 100000000) {
                    resolve({
                        "availableUploadBytes": 100000000 - user.currentUploadSizeBytes
                    });
                    return;
                }
            }
            let set = {
                "$set": {
                    "currentUploadSizeBytes": user.currentUploadSizeBytes + fileSizeBytes
                }
            }
            if (doUpdate === true) {
                await coll.updateOne(filter, set);
            }
            resolve(true);
        } catch (e) {
            reject(new Error("could not update current upload size. Reason: " + e));
        }
    })
}

module.exports = {
    authAPIKey,
    authOTP,
    authUserCredentials,
    getUserTier,
    authUser,
    deleteExpiredUnauth,
    deleteExpiredFileLink,
    updateCurrentUploadSizeBytes
}
