import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Job } from "../models/jobSchema.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { city, job_type, searchKeyword, page = 1, limit = 8 } = req.query;
  const query = {};

  // Filter by city
  if (city && city !== "All") {
    query.city = { $regex: city, $options: "i" };
  }

  // Filter by position type
  if (job_type && job_type !== "All") {
    query.positionType = job_type;
  }

  // Search across multiple fields
  if (searchKeyword) {
    query.$or = [
      { jobTitle: { $regex: searchKeyword, $options: "i" } },
      { companyName: { $regex: searchKeyword, $options: "i" } },
      { experience: { $regex: searchKeyword, $options: "i" } },
      { languages: { $in: [new RegExp(searchKeyword, 'i')] } },
      { frameworks: { $in: [new RegExp(searchKeyword, 'i')] } },
      { databases: { $in: [new RegExp(searchKeyword, 'i')] } },
      { methodologies: { $in: [new RegExp(searchKeyword, 'i')] } },
      { softSkills: { $in: [new RegExp(searchKeyword, 'i')] } }
    ];
  }

  const skip = (page - 1) * limit;
  const totalJobs = await Job.countDocuments(query);

  const jobs = await Job.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 }); // Updated sorting field

  res.status(200).json({
    success: true,
    jobs,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalJobs / limit),
    totalJobs,
  });
});

export const getASingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id);

  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  res.status(200).json({
    success: true,
    job,
  });
});

export const getLatestJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find()
    .sort({ "metadata.createdAt": -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    jobs
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id);
  
  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const jobId = req.params.id;
  const updates = req.body;

  // Get allowed updates from schema paths (dynamic and maintainable)
  const schemaPaths = Object.keys(Job.schema.paths);
  const immutableFields = ['_id', 'createdAt'];
  const allowedUpdates = schemaPaths.filter(
    path => !immutableFields.includes(path)
  );

  // Filter valid updates
  const validUpdates = Object.keys(updates).filter(key => 
    allowedUpdates.includes(key)
  );

  if (validUpdates.length === 0) {
    return next(new ErrorHandler('No valid fields to update', 400));
  }

  // Create update object
  const updateObject = {};
  validUpdates.forEach(key => {
    updateObject[key] = updates[key];
  });

  // Handle update with proper validation
  const updatedJob = await Job.findByIdAndUpdate(
    jobId,
    updateObject,
    { 
      new: true,
      runValidators: true, // Ensures schema validations run
      context: 'query' // Needed for proper $set validation
    }
  );

  if (!updatedJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    job: updatedJob
  });
});

export const createJob = catchAsyncErrors(async (req, res, next) => {
  // Validate conditional submission requirements
  if (req.body.submissionMethod === 'email' && !req.body.contactEmail) {
    return next(new ErrorHandler('Contact email is required for email submissions', 400));
  }
  if (req.body.submissionMethod === 'portal' && !req.body.applicationPortalLink) {
    return next(new ErrorHandler('Application portal link is required for portal submissions', 400));
  }

  if (req.body.keywords && !Array.isArray(req.body.keywords)) {
    return next(new ErrorHandler('Keywords must be an array', 400));
  }

  if (req.body.searchDescription && req.body.searchDescription.length > 160) {
    return next(new ErrorHandler('Search description must be less than 160 characters', 400));
  }

  // Prepare job data with defaults
  const jobData = {
    ...req.body,
    keywords: req.body.keywords || [],
    searchDescription: req.body.searchDescription || '',
    // Set empty arrays for optional technical skills
    languages: req.body.languages || [],
    frameworks: req.body.frameworks || [],
    databases: req.body.databases || [],
    methodologies: req.body.methodologies || [],
    preferredQualifications: req.body.preferredQualifications || [],
    // Initialize optional fields
    startDate: req.body.startDate || null,
    applicationDeadline: req.body.applicationDeadline || null,
    postedBy : req.user._id
  };

  // Let Mongoose handle schema validation
  const newJob = await Job.create(jobData);
  
  res.status(201).json({
    success: true,
    job: newJob,
    message: "Job created successfully"
  });
});

// Additional category-based controllers

export const getAllITJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ category: "IT" });
  
  res.status(200).json({
    success: true,
    jobs
  });
});

export const getAllNonITJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ category: { $ne: "IT" } });
  
  res.status(200).json({
    success: true,
    jobs
  });
});

export const getFeaturedJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ "dates.applicationDeadline": { $gt: new Date() } })
    .sort({ "metadata.createdAt": -1 })
    .limit(3);

  res.status(200).json({
    success: true,
    jobs
  });
});