import express from 'express';
import { 
    createTask,
    getSingleTask,
    deleteTask,
    updateProgress,
    submitForReview,
    approveTask,
    requestChanges,
    addComment,
    getNotStartedTasks,
    getInProgressTasks,
    getCompletedTasks,
    getTasksAssignedToMe,
    getTasksAssignedToOthers
} from '../controllers/taskController.js';
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// ================== TASK CRUD ==================
router.post('/create', isAuthenticated, createTask);
router.get('/get/:id', isAuthenticated, getSingleTask);
router.delete('/delete/:id', isAuthenticated, deleteTask);

// ================== COLUMNS DATA ==================
router.get('/not-started', isAuthenticated, getNotStartedTasks);
router.get('/in-progress', isAuthenticated, getInProgressTasks);
router.get('/completed', isAuthenticated, getCompletedTasks);
router.get('/assigned-to-me', isAuthenticated, getTasksAssignedToMe);
router.get('/assigned-to-others', isAuthenticated, getTasksAssignedToOthers);

// ================== TASK ACTIONS ==================
router.put('/update-progress/:id', isAuthenticated, updateProgress);
router.put('/submit-for-review/:id', isAuthenticated, submitForReview);
router.put('/approve/:id', isAuthenticated, approveTask);
router.put('/request-changes/:id', isAuthenticated, requestChanges);
router.post('/comment/:id', isAuthenticated, addComment);

export default router;