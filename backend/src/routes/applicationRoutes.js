const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applicationsController');


router.get('/:userId/stages/:stageName', applicationsController.getApplicationsByStage);

router.get('/:userId/:applicationId', applicationsController.getApplicationById);

router.get('/:userId', applicationsController.getAllApplications);

router.post('/', applicationsController.createApplication);

router.put('/:applicationId', applicationsController.updateApplication);

router.delete('/:applicationId', applicationsController.deleteApplication);

router.patch('/:applicationId/notes', applicationsController.updateApplicationNotes);

router.patch('/:applicationId/stage', applicationsController.updateStage);

module.exports = router;