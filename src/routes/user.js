const express = require('express');
const router = express.Router();
const verify = require("../middleware/special/verify");
const create = require('../middleware/user/create');
const read = require("../middleware/user/read");
const update = require("../middleware/user/update");
const del = require("../middleware/user/delete");

router.post('/create', create.format , create.response);

router.post('/read', verify.login, read.response);

router.post('/update', update.format, verify.login, update.response);

router.post('/delete', verify.login, del.response);

module.exports = router;

