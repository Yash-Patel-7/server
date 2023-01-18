const {MongoClient, ServerApiVersion} = require("mongodb");

let mongoClient;

async function connectMongoDB() {
    return new Promise(async (resolve, reject) => {
        try {
            mongoClient = new MongoClient(process.env.DATABASE_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverApi: ServerApiVersion.v1
            });
            await mongoClient.connect();
            resolve(await mongoClient.db("sealGuardian"));

        } catch (e) {
            reject(new Error("could not connect to MongoDB. Reason: " + e));
        }
    })
}

async function getSealGuardianDB() {
    return new Promise(async (resolve, reject) => {
        try {
            if (mongoClient === undefined || !mongoClient.isConnected) {
                resolve(await connectMongoDB());

            }
        } catch (e) {
            reject(new Error("could not get SealGuardianDB. Reason: " + e));
        }
    })
}

module.exports = {
    getSealGuardianDB
}

