import express from 'express';
import { 
    getAllTasks,
    createTask,
    getSingleTask,
    updateTask,
    deleteTask,
    assignTask,
    updateStatus,
    updateProgress,
    submitForReview,
    approveTask,
    getTasksAssignedToMe,
    getCreatedByMe,
    addComment,
    getComments,
    deleteComment,
    getActivityLogs,
    getMyPendingTasks,
    getMyCompletedTasks
} from '../controllers/taskController.js';
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get('/', getAllTasks);
router.post('/create', isAuthenticated, createTask);
router.get('/getall', isAuthenticated, getAllTasks);
router.get('/get/:id', isAuthenticated, getSingleTask);
router.put('/update/:id', isAuthenticated, updateTask);
router.put('/assign/:id', isAuthenticated, assignTask);
router.delete('/delete/:id', isAuthenticated, deleteTask);
router.put('/update-status/:id', isAuthenticated, updateStatus);
router.put('/update-progress/:id', isAuthenticated, updateProgress);
router.put('/submit-for-review/:id', isAuthenticated, submitForReview);
router.put('/approve-review/:id', isAuthenticated, approveTask);
router.get('/my-assigned-tasks', isAuthenticated, getTasksAssignedToMe);
router.get('/created-by-me', isAuthenticated, getCreatedByMe);
router.get('/my-pending-tasks', isAuthenticated, getMyPendingTasks);
router.get('/my-completed-tasks', isAuthenticated, getMyCompletedTasks);
router.post('/comment/:id', isAuthenticated, addComment);
router.get('/get-comments/:id', isAuthenticated, getComments);
router.delete('/delete-comment/:id/:commentId', isAuthenticated, deleteComment);
router.get('/activity-logs/:id', isAuthenticated, getActivityLogs);

export default router;
