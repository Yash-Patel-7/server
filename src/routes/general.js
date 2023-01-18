const express = require('express');
const router = express.Router();
const verify = require("../middleware/special/verify");
const authorize = require("../middleware/general/authorize");
const login = require("../middleware/general/login");
const otp = require("../middleware/general/otp");
const logout = require("../middleware/general/logout");

router.get('/authorize', authorize.format, verify.email, authorize.response);

router.post('/login', login.format, login.response);

router.post('/otp', otp.format, verify.otp);

router.post('/logout', verify.login, logout.response);

module.exports = router;

