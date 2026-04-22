const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTask, applyForTask, getMyTasks, getTaskApplications } = require('../controllers/tasksController');
const { protect } = require('../middleware/auth');

router.get('/', getTasks);
router.post('/', protect, createTask);
router.get('/my/tasks', protect, getMyTasks);
router.get('/:id', getTask);
router.post('/:id/apply', protect, applyForTask);
router.get('/:id/applications', protect, getTaskApplications);

module.exports = router;
