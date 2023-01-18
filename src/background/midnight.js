const {deleteExpiredUnauth, deleteExpiredFileLink} = require('../database/security');

let checkMidnightIntervalID;
let midnightProcessID;

function startMidnightProcess() {
    checkMidnightIntervalID = setInterval(startAtMidnight, 60000);
    startAtMidnight();
}

function startAtMidnight() {
    let currentDate = new Date();
    if ((currentDate.getHours() === 0) && (currentDate.getMinutes() === 0)) {
        clearInterval(checkMidnightIntervalID);
        midnightProcessID = setInterval(midnightProcess, 86400000);
        midnightProcess().then(() => {}, () => {});
    }
}

function stopMidnightProcess() {
    clearInterval(midnightProcessID);
}

async function midnightProcess() {
    return new Promise(async (resolve, reject) => {
        try {
            consoleLog("Started");
            let results = await Promise.allSettled([
                deleteExpiredUnauth(),
                deleteExpiredFileLink()
            ]);
            results.forEach(r => consoleLog(r));
            consoleLog("Finished");
            resolve("finished midnight process");

        } catch (e) {
            reject(new Error("could not finish midnight process. Reason: " + e));
        }
    });
}

function consoleLog(message) {
    console.log("[Midnight Process] [" + new Date().toString() + "] [" + message + "]");
}

module.exports = {startMidnightProcess, stopMidnightProcess};


