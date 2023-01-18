const nodemailer = require("nodemailer");

let transporter;

function createEmailTransporter() {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
}

async function sendOTPEmail(document) {
    return new Promise(async (resolve, reject) => {
        try {
            if (transporter === undefined) {
                createEmailTransporter();
            }
            await transporter.sendMail({
                from: `"Seal Guardian"` + " <" + process.env.EMAIL_ADDRESS + ">",
                to: document.userEmail,
                subject: "One-Time Passcode - Seal Guardian",
                text: "OTP: " + document.otp,
                html: "<h1>OTP: {otp}</h1>".replace("{otp}", document.otp),
            });
            resolve({
                "OTP": "SENT"
            });

        } catch (e) {
            reject(new Error("could not send OTP email. Reason: " + e));
        }
    })
}

async function sendAuthorizationEmail(document) {
    return new Promise(async (resolve, reject) => {
        try {
            if (transporter === undefined) {
                createEmailTransporter();
            }
            let link = process.env.APP_DOMAIN + "/api/v1/general/authorize?unauthID=" + document.unauthID;
            await transporter.sendMail({
                from: `"Seal Guardian"` + " <" + process.env.EMAIL_ADDRESS + ">",
                to: document.userEmail,
                subject: "Authorize Email - Seal Guardian",
                text: "Authorization Link: " + link,
                html: "<h1>Authorization Link: {link}</h1>".replace("{link}", link),
            });
            resolve({
                "AUTHORIZATION": "SENT"
            });

        } catch (e) {
            reject(new Error("could not send authorization email. Reason: " + e));
        }
    })
}

module.exports = {
    sendOTPEmail,
    sendAuthorizationEmail
}

