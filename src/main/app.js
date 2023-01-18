const fs = require('fs');
const https = require('https');
const express = require('express');
const compression = require("compression");
const path = require("path");
const cors = require('cors');
const cor = require('../middleware/special/cors');
const parse = require("../middleware/special/parse");
const generalRouter = require("../routes/general");
const userRouter = require('../routes/user.js');
const fileLinkRouter = require('../routes/fileLink.js');
const midnight = require('../background/midnight');

const app = express();
const key = fs.readFileSync(path.resolve('cert/CA/localhost/localhost.decrypted.key'));
const cert = fs.readFileSync(path.resolve('cert/CA/localhost/localhost.crt'));
const server = https.createServer({key, cert}, app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());
app.use(cor.config);
app.use(parse.headers);
app.use("/api/v1/general", generalRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/fileLink", fileLinkRouter);

server.listen(parseInt(process.env.APP_PORT, 10), () => {
    console.log(`Running on ${process.env.APP_DOMAIN}`);
});

midnight.startMidnightProcess();

app.get('/api/v1/test/upload', (req, res) => {
    res.sendFile(path.resolve('test/multipart.html'));
});

