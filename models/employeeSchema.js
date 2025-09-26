// src/lib/models/Employee.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  empId: {               // Unique ID for barcode/QR
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {                // Full name
    type: String,
    required: true
  },
  photoUrl: {            // Profile photo
    type: String,
    required: true
  },
  role: {                // Job title / designation
    type: String,
    required: true
  },
  department: {          // Optional department
    type: String,
    required: false
  },
  email: {               // Official email
    type: String,
    required: true,
    unique: true
  },
  phone: {               // Optional contact number
    type: String,
    required: false
  },
  linkedin: {            // Professional profile
    type: String,
    required: false
  },
  github: {              // GitHub profile (if relevant)
    type: String,
    required: false
  },
  active: {              // Status flag
    type: Boolean,
    default: true
  },
  createdAt: {           // Auto timestamps
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update updatedAt automatically
employeeSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export const Employee = mongoose.model("Employee", employeeSchema);
