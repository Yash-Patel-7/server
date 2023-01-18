const express = require('express');
const router = express.Router();
const verify = require('../middleware/special/verify');
const create = require('../middleware/fileLink/create');
const read = require("../middleware/fileLink/read");
const update = require("../middleware/fileLink/update");
const del = require("../middleware/fileLink/delete");

router.post('/create', verify.login, verify.totalFileSizeBytes, create.upload);

router.post('/read', verify.login, read.response);

router.post('/update', update.format, verify.login, update.response);

router.post('/delete', del.format, verify.login, del.response);

module.exports = router;

