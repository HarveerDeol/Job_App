const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');


router.get('/:userId/pending', notificationsController.getPendingNotifications);

router.get('/:userId', notificationsController.getAllNotifications);

router.post('/', notificationsController.createNotification);

router.put('/:notificationId', notificationsController.updateNotification);

router.patch('/:notificationId/read', notificationsController.completeNotification)


module.exports = router;