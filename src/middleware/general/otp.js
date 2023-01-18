const {checkOTPFormat} = require("../../helper/format");

function format(req, res, next) {
    if (!checkOTPFormat(req.body)) {
        res.status(400).json({
            "otp": "String"
        })
        return;
    }
    next();
}

module.exports = {
    format
}

