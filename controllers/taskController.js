import { Task } from "../models/taskSchema.js";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

// ================== HELPER FUNCTIONS ==================

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
    case "status_changed":
      return `Status changed from "${statusMap[changes.from]}" to "${statusMap[changes.to]}" by ${userName}`;
    case "progress_updated":
      return `Progress updated from ${changes.from}% to ${changes.to}% by ${userName}`;
    case "comment_added":
      return `Comment added by ${userName}`;
    case "task_completed":
      return `Task approved and completed by ${userName}`;
    case "submitted_for_review":
      return `Task submitted for review by ${userName}`;
    default:
      return `Task modified by ${userName}`;
  }
};

const addActivityLog = (task, action, userId, userName, changes = {}) => {
  const message = generateActivityMessage(action, changes, userName);
  task.activityLogs.push({
    action,
    byUser: userId,
    changes: { ...changes, message },
    timestamp: new Date()
  });
};

// ================== 1. CREATE TASK ==================

export const createTask = catchAsyncErrors(async (req, res, next) => {
  const { title, description, relatedTo, assignedTo, priority, dueDate, notes } = req.body;

  if (!title || !relatedTo || !dueDate) {
    return next(new ErrorHandler("Title, relatedTo, and dueDate are required", 400));
  }

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

  addActivityLog(task, "task_created", req.user._id, req.user.name);

  if (assignedTo && assignedTo.length > 0) {
    const assignedUsers = await User.find({ _id: { $in: assignedTo } }).select("name");
    const assignedNames = assignedUsers.map(u => u.name).join(", ");
    
    addActivityLog(task, "task_assigned", req.user._id, req.user.name, {
      assignedTo: assignedUsers.map(u => ({ id: u._id, name: u.name })),
      assignedNames
    });
  }

  await task.save();
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

// ================== 2. GET TASKS BY COLUMNS ==================

// Column 1: Not Started Tasks (created by me OR assigned to me)
export const getNotStartedTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({
    $or: [
      { createdBy: req.user._id },
      { assignedTo: { $in: [req.user._id] } }
    ],
    status: "not_started"
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Column 2: In Progress Tasks (created by me OR assigned to me)
export const getInProgressTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({
    $or: [
      { createdBy: req.user._id },
      { assignedTo: { $in: [req.user._id] } }
    ],
    status: "in_progress"
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Column 3: Completed Tasks (created by me with no assignees OR assigned to me)
export const getCompletedTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({
    $or: [
      // Tasks I created with no assignees (I should see these when completed)
      { 
        createdBy: req.user._id,
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: { $size: 0 } }
        ]
      },
      // Tasks assigned to me (regardless of who created them)
      { assignedTo: { $in: [req.user._id] } }
    ],
    status: "completed"
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .sort({ completionDate: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Column 4: Tasks Assigned to Me (where I'm the assignee, not creator)
export const getTasksAssignedToMe = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({
    assignedTo: { $in: [req.user._id] },
    createdBy: { $ne: req.user._id } // Exclude tasks I created
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Column 5: Tasks I Assigned to Others (I'm creator, others are assignees)
export const getTasksAssignedToOthers = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({
    createdBy: req.user._id,
    assignedTo: { $exists: true, $ne: [] } // Has assignees
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// ================== 3. UPDATE PROGRESS ==================

export const updateProgress = catchAsyncErrors(async (req, res, next) => {
  const { currentProgress } = req.body;

  if (currentProgress === undefined || currentProgress < 0 || currentProgress > 100) {
    return next(new ErrorHandler("Progress must be between 0 and 100", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Check if user is creator or assignee
  const isCreator = task.createdBy.toString() === req.user._id.toString();
  const isAssignee = task.assignedTo.some(id => id.toString() === req.user._id.toString());

  if (!isCreator && !isAssignee) {
    return next(new ErrorHandler("Not authorized to update this task", 403));
  }

  const oldProgress = task.currentProgress;
  const oldStatus = task.status;
  task.currentProgress = currentProgress;

  // Auto-change from 'not_started' to 'in_progress'
  if (oldProgress === 0 && currentProgress > 0 && task.status === "not_started") {
    task.status = "in_progress";
    addActivityLog(task, "status_changed", req.user._id, req.user.name, {
      from: oldStatus,
      to: "in_progress"
    });
  }

  // Log the progress change
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

// ================== 4. COMMENTS ==================

export const addComment = catchAsyncErrors(async (req, res, next) => {
  const { comment } = req.body;

  if (!comment || comment.trim().length === 0) {
    return next(new ErrorHandler("Comment cannot be empty", 400));
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Check if user is creator or assignee
  const isCreator = task.createdBy.toString() === req.user._id.toString();
  const isAssignee = task.assignedTo.some(id => id.toString() === req.user._id.toString());

  if (!isCreator && !isAssignee) {
    return next(new ErrorHandler("Not authorized to comment on this task", 403));
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

// ================== 5. SUBMIT FOR REVIEW (Assignee Only) ==================

export const submitForReview = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Only assignees can submit for review
  const isAssignee = task.assignedTo.some(id => id.toString() === req.user._id.toString());

  if (!isAssignee) {
    return next(new ErrorHandler("Only assigned users can submit for review", 403));
  }

  if (task.status === "completed") {
    return next(new ErrorHandler("Task is already completed", 400));
  }

  const oldStatus = task.status;
  task.status = "review";

  addActivityLog(task, "submitted_for_review", req.user._id, req.user.name, {
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

// ================== 6. APPROVE TASK (Creator Only) ==================

export const approveTask = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Only task creator can approve
  const isCreator = task.createdBy.toString() === req.user._id.toString();

  if (!isCreator) {
    return next(new ErrorHandler("Only task creator can approve tasks", 403));
  }

  if (task.status === "completed") {
    return next(new ErrorHandler("Task is already completed", 400));
  }

  const oldStatus = task.status;
  task.status = "completed";
  task.currentProgress = 100;
  task.completionDate = new Date();

  addActivityLog(task, "status_changed", req.user._id, req.user.name, {
    from: oldStatus,
    to: "completed"
  });

  addActivityLog(task, "task_completed", req.user._id, req.user.name);

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

// ================== 7. GET SINGLE TASK ==================

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

// ================== 8. DELETE TASK (Creator Only) ==================

export const deleteTask = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Only creator can delete
  if (task.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Not authorized to delete this task", 403));
  }

  await task.deleteOne();

  res.status(200).json({
    success: true,
    message: "Task deleted successfully"
  });
});

// ================== 9. REQUEST CHANGES (Creator Only) ==================
export const requestChanges = catchAsyncErrors(async (req, res, next) => {
  const { feedback } = req.body;
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }
  
  const isCreator = task.createdBy.toString() === req.user._id.toString();
  
  if (!isCreator) {
    return next(new ErrorHandler("Only task creator can request changes", 403));
  }
  
  if (task.status !== "review") {
    return next(new ErrorHandler("Task must be in review status", 400));
  }
  
  const oldStatus = task.status;
  task.status = "in_progress";
  
  if (feedback) {
    task.comments.push({
      user: req.user._id,
      comment: feedback,
      createdAt: new Date()
    });
  }
  
  addActivityLog(task, "changes_requested", req.user._id, req.user.name, {
    from: oldStatus,
    to: "in_progress"
  });
  
  await task.save();
  await task.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);
  
  res.status(200).json({
    success: true,
    message: "Changes requested",
    task
  });
});

// ================== 10. GET ACTIVITY LOGS ==================
export const getActivityLogs = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate("activityLogs.byUser", "name email");

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  res.status(200).json({
    success: true,
    activityLogs: task.activityLogs
  });
});

// ================== GET USER'S TASKS (VIEW ONLY FOR ADMINS) ==================

// Get all tasks for a specific user (organized by columns)
export const getUserTasks = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  // Verify the target user exists
  const targetUser = await User.findById(userId).select("name email");
  
  if (!targetUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Fetch all tasks for this user (created by them or assigned to them)
  const [notStarted, inProgress, completed, assignedToUser, assignedToOthers] = await Promise.all([
    // Not Started Tasks
    Task.find({
      $or: [
        { createdBy: userId },
        { assignedTo: { $in: [userId] } }
      ],
      status: "not_started"
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 }),

    // In Progress Tasks
    Task.find({
      $or: [
        { createdBy: userId },
        { assignedTo: { $in: [userId] } }
      ],
      status: "in_progress"
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 }),

    // Completed Tasks
    Task.find({
      $or: [
        { 
          createdBy: userId,
          $or: [
            { assignedTo: { $exists: false } },
            { assignedTo: { $size: 0 } }
          ]
        },
        { assignedTo: { $in: [userId] } }
      ],
      status: "completed"
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email")
      .sort({ completionDate: -1 }),

    // Tasks Assigned to This User
    Task.find({
      assignedTo: { $in: [userId] },
      createdBy: { $ne: userId }
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 }),

    // Tasks This User Assigned to Others
    Task.find({
      createdBy: userId,
      assignedTo: { $exists: true, $ne: [] }
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 })
  ]);

  res.status(200).json({
    success: true,
    user: targetUser,
    tasks: {
      notStarted,
      inProgress,
      completed,
      assignedToUser,
      assignedToOthers
    },
    counts: {
      notStarted: notStarted.length,
      inProgress: inProgress.length,
      completed: completed.length,
      assignedToUser: assignedToUser.length,
      assignedToOthers: assignedToOthers.length,
      total: notStarted.length + inProgress.length + completed.length + assignedToUser.length + assignedToOthers.length
    }
  });
});

// Get single task for viewing (read-only, no authorization check)
export const getTaskForViewing = catchAsyncErrors(async (req, res, next) => {
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
    task,
    viewOnly: true // Flag to indicate this is a read-only view
  });
});