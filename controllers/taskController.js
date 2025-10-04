import { Task } from "../models/taskSchema.js";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

// ================== HELPER FUNCTIONS ==================

// Generate human-readable activity log messages
const generateActivityMessage = (action, changes, userName) => {
  const statusMap = {
    not_started: "Not Started",
    in_progress: "In Progress",
    review: "Review",
    completed: "Completed"
  };

  switch (action) {
    case "task_created":
      return `Task created by ${userName}`;
    case "task_assigned":
      return `Task assigned to ${changes.assignedNames} by ${userName}`;
    case "task_reassigned":
      return `Task reassigned to ${changes.assignedNames} by ${userName}`;
    case "status_changed":
      return `Status changed from "${statusMap[changes.from]}" to "${statusMap[changes.to]}" by ${userName}`;
    case "priority_changed":
      return `Priority changed from "${changes.from}" to "${changes.to}" by ${userName}`;
    case "progress_updated":
      return `Progress updated from ${changes.from}% to ${changes.to}% by ${userName}`;
    case "due_date_changed":
      const oldDate = new Date(changes.from).toLocaleDateString();
      const newDate = new Date(changes.to).toLocaleDateString();
      return `Due date changed from ${oldDate} to ${newDate} by ${userName}`;
    case "task_completed":
      const completionDate = new Date(changes.completedAt).toLocaleString();
      return `Task completed by ${userName} at ${completionDate}`;
    case "comment_added":
      return `Comment added by ${userName}`;
    case "task_updated":
      return `Task updated by ${userName}`;
    default:
      return `Task modified by ${userName}`;
  }
};

// Add activity log to task
const addActivityLog = (task, action, userId, userName, changes = {}) => {
  const message = generateActivityMessage(action, changes, userName);
  task.activityLogs.push({
    action,
    byUser: userId,
    changes: { ...changes, message },
    timestamp: new Date()
  });
};

// ================== 1. TASK CRUD OPERATIONS ==================

// Create Task
export const createTask = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    description,
    relatedTo,
    assignedTo,
    priority,
    dueDate,
    notes
  } = req.body;

  // Validate required fields
  if (!title || !relatedTo || !dueDate) {
    return next(new ErrorHandler("Title, relatedTo, and dueDate are required", 400));
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    relatedTo,
    createdBy: req.user._id,
    assignedTo: assignedTo || [],
    priority: priority || "medium",
    dueDate,
    notes
  });

  // Add activity log for task creation
  addActivityLog(task, "task_created", req.user._id, req.user.name);

  // If assigned to users, add assignment log
  if (assignedTo && assignedTo.length > 0) {
    const assignedUsers = await User.find({ _id: { $in: assignedTo } }).select("name");
    const assignedNames = assignedUsers.map(u => u.name).join(", ");
    
    addActivityLog(task, "task_assigned", req.user._id, req.user.name, {
      assignedTo: assignedUsers.map(u => ({ id: u._id, name: u.name })),
      assignedNames
    });
  }

  await task.save();

  // Populate user data before sending response
  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    task
  });
});

// Get All Tasks (with filters)
export const getAllTasks = catchAsyncErrors(async (req, res, next) => {
  const {
    status,
    priority,
    relatedTo,
    assignedTo,
    createdBy,
    search,
    sortBy = "createdAt",
    order = "desc"
  } = req.query;

  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (relatedTo) filter.relatedTo = relatedTo;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (createdBy) filter.createdBy = createdBy;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const tasks = await Task.find(filter)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .populate("activityLogs.byUser", "name email")
    .sort({ [sortBy]: order === "desc" ? -1 : 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Get Single Task
export const getSingleTask = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .populate("activityLogs.byUser", "name email");

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  res.status(200).json({
    success: true,
    task
  });
});

// Update Task
export const updateTask = catchAsyncErrors(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  const {
    title,
    description,
    relatedTo,
    priority,
    dueDate,
    notes
  } = req.body;

  // Track changes for activity log
  const changes = {};
  
  if (title && title !== task.title) {
    changes.title = { from: task.title, to: title };
    task.title = title;
  }
  
  if (description !== undefined) task.description = description;
  if (relatedTo) task.relatedTo = relatedTo;
  if (notes !== undefined) task.notes = notes;
  
  if (priority && priority !== task.priority) {
    addActivityLog(task, "priority_changed", req.user._id, req.user.name, {
      from: task.priority,
      to: priority
    });
    task.priority = priority;
  }
  
  if (dueDate && new Date(dueDate).getTime() !== task.dueDate.getTime()) {
    addActivityLog(task, "due_date_changed", req.user._id, req.user.name, {
      from: task.dueDate,
      to: dueDate
    });
    task.dueDate = dueDate;
  }

  // Add general update log if there were changes
  if (Object.keys(changes).length > 0 || description !== undefined || relatedTo || notes !== undefined) {
    addActivityLog(task, "task_updated", req.user._id, req.user.name, changes);
  }

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    task
  });
});

// Delete Task
export const deleteTask = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  await task.deleteOne();

  res.status(200).json({
    success: true,
    message: "Task deleted successfully"
  });
});

// ================== 2. TASK STATUS & WORKFLOW ==================

// Update Status
export const updateStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.body;

  if (!status || !["not_started", "in_progress", "review", "completed"].includes(status)) {
    return next(new ErrorHandler("Invalid status value", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  const oldStatus = task.status;
  task.status = status;

  // Add status change log
  addActivityLog(task, "status_changed", req.user._id, req.user.name, {
    from: oldStatus,
    to: status
  });

  // If completed, add completion log
  if (status === "completed") {
    const completionDate = new Date();
    addActivityLog(task, "task_completed", req.user._id, req.user.name, {
      completedAt: completionDate
    });
  }

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Status updated successfully",
    task
  });
});

// Update Progress
export const updateProgress = catchAsyncErrors(async (req, res, next) => {
  const { currentProgress } = req.body;

  if (currentProgress === undefined || currentProgress < 0 || currentProgress > 100) {
    return next(new ErrorHandler("Progress must be between 0 and 100", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  const oldProgress = task.currentProgress;
  task.currentProgress = currentProgress;

  // Add progress update log
  addActivityLog(task, "progress_updated", req.user._id, req.user.name, {
    from: oldProgress,
    to: currentProgress
  });

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Progress updated successfully",
    task
  });
});

// Submit for Review
export const submitForReview = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  if (task.status === "completed") {
    return next(new ErrorHandler("Task is already completed", 400));
  }

  const oldStatus = task.status;
  task.status = "review";

  addActivityLog(task, "status_changed", req.user._id, req.user.name, {
    from: oldStatus,
    to: "review"
  });

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Task submitted for review",
    task
  });
});

// Approve/Complete Task
export const approveTask = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  if (task.status === "completed") {
    return next(new ErrorHandler("Task is already completed", 400));
  }

  const oldStatus = task.status;
  task.status = "completed";

  addActivityLog(task, "status_changed", req.user._id, req.user.name, {
    from: oldStatus,
    to: "completed"
  });

  const completionDate = new Date();
  addActivityLog(task, "task_completed", req.user._id, req.user.name, {
    completedAt: completionDate
  });

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Task approved and completed",
    task
  });
});

// ================== 3. TASK ASSIGNMENT ==================

// Assign Task to Users
export const assignTask = catchAsyncErrors(async (req, res, next) => {
  const { assignedTo } = req.body;

  if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) {
    return next(new ErrorHandler("Please provide users to assign", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Get user names for activity log
  const assignedUsers = await User.find({ _id: { $in: assignedTo } }).select("name");
  const assignedNames = assignedUsers.map(u => u.name).join(", ");

  task.assignedTo = assignedTo;

  addActivityLog(task, "task_assigned", req.user._id, req.user.name, {
    assignedTo: assignedUsers.map(u => ({ id: u._id, name: u.name })),
    assignedNames
  });

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Task assigned successfully",
    task
  });
});

// Reassign Task
export const reassignTask = catchAsyncErrors(async (req, res, next) => {
  const { assignedTo } = req.body;

  if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) {
    return next(new ErrorHandler("Please provide users to reassign", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Get user names for activity log
  const assignedUsers = await User.find({ _id: { $in: assignedTo } }).select("name");
  const assignedNames = assignedUsers.map(u => u.name).join(", ");

  task.assignedTo = assignedTo;

  addActivityLog(task, "task_reassigned", req.user._id, req.user.name, {
    assignedTo: assignedUsers.map(u => ({ id: u._id, name: u.name })),
    assignedNames
  });

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Task reassigned successfully",
    task
  });
});

// Remove Assignment
export const unassignTask = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorHandler("Please provide userId to unassign", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Remove user from assignedTo array
  task.assignedTo = task.assignedTo.filter(id => id.toString() !== userId);

  const unassignedUser = await User.findById(userId).select("name");
  
  addActivityLog(task, "task_updated", req.user._id, req.user.name, {
    action: `Removed ${unassignedUser.name} from task`
  });

  await task.save();

  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "User unassigned successfully",
    task
  });
});

// ================== 4. COMMENTS ==================

// Add Comment
export const addComment = catchAsyncErrors(async (req, res, next) => {
  const { comment } = req.body;

  if (!comment || comment.trim().length === 0) {
    return next(new ErrorHandler("Comment cannot be empty", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  task.comments.push({
    user: req.user._id,
    comment: comment.trim(),
    createdAt: new Date()
  });

  addActivityLog(task, "comment_added", req.user._id, req.user.name);

  await task.save();

  await task.populate([
    { path: "comments.user", select: "name email" },
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Comment added successfully",
    task
  });
});

// Get Comments
export const getComments = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .select("comments")
    .populate("comments.user", "name email");

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  res.status(200).json({
    success: true,
    comments: task.comments
  });
});

// Delete Comment
export const deleteComment = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  const comment = task.comments.id(req.params.commentId);

  if (!comment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  // Only comment owner or task creator can delete
  if (comment.user.toString() !== req.user._id.toString() && 
      task.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Not authorized to delete this comment", 403));
  }

  comment.deleteOne();
  await task.save();

  res.status(200).json({
    success: true,
    
    message: "Comment deleted successfully"
  });
});

// ================== 5. ACTIVITY LOGS ==================

// Get Activity Logs
export const getActivityLogs = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .select("activityLogs")
    .populate("activityLogs.byUser", "name email");

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  res.status(200).json({
    success: true,
    activityLogs: task.activityLogs
  });
});

// Get All Activity (for analytics)
export const getAllActivity = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate, userId, action } = req.query;

  const filter = {};

  if (startDate || endDate) {
    filter["activityLogs.timestamp"] = {};
    if (startDate) filter["activityLogs.timestamp"].$gte = new Date(startDate);
    if (endDate) filter["activityLogs.timestamp"].$lte = new Date(endDate);
  }

  if (userId) {
    filter["activityLogs.byUser"] = userId;
  }

  if (action) {
    filter["activityLogs.action"] = action;
  }

  const tasks = await Task.find(filter)
    .select("title activityLogs")
    .populate("activityLogs.byUser", "name email");

  // Flatten activity logs from all tasks
  const allActivityLogs = [];
  tasks.forEach(task => {
    task.activityLogs.forEach(log => {
      allActivityLogs.push({
        ...log.toObject(),
        taskId: task._id,
        taskTitle: task.title
      });
    });
  });

  // Sort by timestamp descending
  allActivityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.status(200).json({
    success: true,
    count: allActivityLogs.length,
    activityLogs: allActivityLogs
  });
});

// ================== 6. FILTERING & SEARCH ==================

// My Tasks (assigned to me)
export const getTasksAssignedToMe = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Tasks I Created
export const getCreatedByMe = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({ createdBy: req.user._id })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

//Tasks I have in pending status
export const getMyPendingTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({ 
    assignedTo: req.user._id, 
    status: { $ne: "completed" } // Not completed
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

//Tasks I completed
export const getMyCompletedTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({
    //search tasks assigned to me or created by me and with completed status
    $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    status: "completed"
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Tasks by Department
export const getTasksByDepartment = catchAsyncErrors(async (req, res, next) => {
  const { relatedTo } = req.params;

  const tasks = await Task.find({ relatedTo })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    department: relatedTo,
    count: tasks.length,
    tasks
  });
});

// Search Tasks
export const searchTasks = catchAsyncErrors(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return next(new ErrorHandler("Please provide search query", 400));
  }

  const tasks = await Task.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { notes: { $regex: q, $options: "i" } }
    ]
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// ================== 7. DASHBOARD & ANALYTICS ==================

// Dashboard Stats
export const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: "completed" });
  const inProgressTasks = await Task.countDocuments({ status: "in_progress" });
  const reviewTasks = await Task.countDocuments({ status: "review" });
  const notStartedTasks = await Task.countDocuments({ status: "not_started" });

  // Overdue tasks
  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $ne: "completed" }
  });

  // Tasks by priority
  const highPriorityTasks = await Task.countDocuments({ priority: "high" });
  const mediumPriorityTasks = await Task.countDocuments({ priority: "medium" });
  const lowPriorityTasks = await Task.countDocuments({ priority: "low" });

  // Completion rate
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

  // Average completion time (for completed tasks)
  const completedTasksWithDates = await Task.find({
    status: "completed",
    completionDate: { $exists: true }
  }).select("createdAt completionDate");

  let avgCompletionTime = 0;
  if (completedTasksWithDates.length > 0) {
    const totalTime = completedTasksWithDates.reduce((sum, task) => {
      const timeDiff = task.completionDate - task.createdAt;
      return sum + timeDiff;
    }, 0);
    avgCompletionTime = Math.round(totalTime / completedTasksWithDates.length / (1000 * 60 * 60 * 24)); // in days
  }

  res.status(200).json({
    success: true,
    stats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      notStartedTasks,
      overdueTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      completionRate: `${completionRate}%`,
      avgCompletionTime: `${avgCompletionTime} days`
    }
  });
});

// Tasks by Status (for columns)
export const getTasksByStatus = catchAsyncErrors(async (req, res, next) => {
  const notStarted = await Task.find({ status: "not_started" })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  const inProgress = await Task.find({ status: "in_progress" })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  const review = await Task.find({ status: "review" })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  const completed = await Task.find({ status: "completed" })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ completionDate: -1 });

  res.status(200).json({
    success: true,
    tasks: {
      not_started: notStarted,
      in_progress: inProgress,
      review: review,
      completed: completed
    }
  });
});

// Tasks by Priority
export const getTasksByPriority = catchAsyncErrors(async (req, res, next) => {
  const high = await Task.find({ priority: "high" })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  const medium = await Task.find({ priority: "medium" })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  const low = await Task.find({ priority: "low" })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    tasks: {
      high,
      medium,
      low
    }
  });
});

// Overdue Tasks
export const getOverdueTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({
    dueDate: { $lt: new Date() },
    status: { $ne: "completed" }
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ dueDate: 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Upcoming Tasks
export const getUpcomingTasks = catchAsyncErrors(async (req, res, next) => {
  const { days = 7 } = req.query;

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + parseInt(days));

  const tasks = await Task.find({
    dueDate: { $gte: today, $lte: futureDate },
    status: { $ne: "completed" }
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ dueDate: 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});
