const express = require('express');
const router = express.Router();
const { compileLatex } = require('../controllers/latexController');

router.post('/compile', compileLatex);

module.exports = router;