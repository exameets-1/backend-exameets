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
  try {
    const jobId = req.params.id;
    const updates = req.body;

    // Find the job
    const job = await Job.findById(jobId);

    if (!job) {
      return next(new ErrorHandler("Job not found", 404));
    }

    // Remove any undefined or null values from updates
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === null) {
        delete updates[key];
      }
    });

    // Update the job
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $set: updates },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job: updatedJob
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export const getAllITJobs = catchAsyncErrors(async (req, res, next) => {
  try {
    const jobs = await Job.find({ category: 'IT' });
    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export const getAllNonITJobs = catchAsyncErrors(async (req, res, next) => {
  try {
    const jobs = await Job.find({ category: { $ne: 'IT' } });
    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export const createJob = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            category,
            job_type,
            organization,
            location,
            role,
            experience_required,
            skills_required,
            post_date,
            eligibility_criteria,
            application_link,
            description,
            salary_range,
            last_date,
            valid_until,
            vacancy,
            qualification
        } = req.body;

        // Validate required fields
        const requiredFields = [
            'category',
            'job_type',
            'organization',
            'location',
            'role',
            'experience_required',
            'skills_required',
            'post_date',
            'eligibility_criteria',
            'application_link',
            'description',
            'salary_range',
            'last_date',
            'valid_until',
            'vacancy',
            'qualification'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return next(new ErrorHandler(`Missing required fields: ${missingFields.join(', ')}`, 400));
        }

        // Convert date strings to Date objects and set notification_about based on category
        const formattedData = {
            ...req.body,
            post_date: new Date(post_date),
            last_date: new Date(last_date),
            valid_until: new Date(valid_until),
            notification_about: category.toLowerCase() === 'it' ? 'techjobs' : 'techjobs'  // both IT and NON-IT are techjobs
        };

        const newJob = await Job.create(formattedData);
        
        res.status(201).json({
            success: true,
            job: newJob,
            message: "Job created successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});
