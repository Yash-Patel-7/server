async function promise() {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(true);
        } catch (e) {
            reject(new Error("could not generate promise template. Reason: " + e));
        }
    })
}

