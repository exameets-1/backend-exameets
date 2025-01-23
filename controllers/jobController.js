import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Job } from "../models/jobSchema.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { city, job_type, searchKeyword, page = 1, limit = 8 } = req.query;
  const query = {};

  // Filter by location
  if (city && city !== "All") {
    query.location = { $regex: city, $options: "i" };
  }

  // Filter by job type
  if (job_type && job_type !== "All") {
    query.job_type = job_type;
  }

  // Update search query to match schema fields
  if (searchKeyword) {
    query.$or = [
      { role: { $regex: searchKeyword, $options: "i" } },
      { organization: { $regex: searchKeyword, $options: "i" } },
      { location: { $regex: searchKeyword, $options: "i" } },
      { experience_required: { $regex: searchKeyword, $options: "i" } },
      { skills_required: { $in: [new RegExp(searchKeyword, 'i')] } },
      { job_type: { $regex: searchKeyword, $options: "i" } }
    ];
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Get total count of matching documents
  const totalJobs = await Job.countDocuments(query);

  // Get paginated results
  const jobs = await Job.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({_id : -1});
  

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
    .sort({ _id: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    jobs
  });
});
