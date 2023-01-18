const {checkUnauthID} = require("../../helper/format");

function format(req, res, next) {
    if (!checkUnauthID(req.query)) {
        res.redirect("/signup");
        return;
    }
    next();
}

function response(req, res) {
    res.redirect("/login");
}

module.exports = {
    format,
    response
}
