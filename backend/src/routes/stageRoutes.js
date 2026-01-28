const express = require('express');
const router = express.Router();
const stagesController = require('../controllers/stagesController');


router.get('/', stagesController.getAllStages);

router.get('/:stageName', stagesController.getStageByName);

router.post('/', stagesController.createStage);

module.exports = router;