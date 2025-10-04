import mongoose from "mongoose";

// ================== TASK SCHEMA ==================
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter task title"],
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxLength: [1000, "Description cannot exceed 1000 characters"]
    },
    relatedTo: {
      type: String,
      enum: [
        "learning-and-development",
        "research-and-development",
        "finance",
        "administration",
        "tech",
        "marketing",
        "others"
      ],
      required: [true, "Please specify the related department/area"]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "review", "completed"],
      default: "not_started"
    },
    currentProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    dueDate: {
      type: Date,
      required: true
    },
    completionDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [2000, "Notes cannot exceed 2000 characters"]
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        comment: {
          type: String,
          required: true,
          trim: true,
          maxLength: [500, "Comment cannot exceed 500 characters"]
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    activityLogs: [
      {
        action: { 
          type: String, 
          required: true 
        },
        byUser: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "User",
          required: true
        },
        changes: {
          type: mongoose.Schema.Types.Mixed
        },
        timestamp: { 
          type: Date, 
          default: Date.now 
        }
      }
    ]
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// ================== INDEXES ==================
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ relatedTo: 1, priority: 1 });

// ================== PRE-SAVE HOOK ==================
taskSchema.pre("save", function (next) {
  // Auto-set completion date and progress when status becomes 'completed'
  if (this.status === "completed") {
    if (!this.completionDate) {
      this.completionDate = new Date();
    }
    if (this.currentProgress < 100) {
      this.currentProgress = 100;
    }
  }
  
  // Reset completion date if status changes from completed to something else
  if (this.isModified("status") && this.status !== "completed") {
    this.completionDate = null;
  }
  
  next();
});

// ================== METHODS ==================
// Add activity log helper method
taskSchema.methods.addActivityLog = function(action, userId, changes = null) {
  this.activityLogs.push({
    action,
    byUser: userId,
    changes,
    timestamp: new Date()
  });
  return this.save();
};

export const Task = mongoose.model("Task", taskSchema);