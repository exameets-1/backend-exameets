import { GovtJob } from "../models/govtJobSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";


export const getAllGovtJobs = catchAsyncErrors(async (req, res, next) => {
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

    // Enhanced search functionality
    if (searchKeyword) {
        const searchRegex = new RegExp(searchKeyword, 'i');
        query.$or = [
            { role: { $regex: searchRegex } },
            { department: { $regex: searchRegex } },
            { location: { $regex: searchRegex } },
            { organization: { $regex: searchRegex } },
            { post: { $regex: searchRegex } },
            { notification_about: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { qualifications: { $regex: searchRegex } },
            { job_type: { $regex: searchRegex } }
        ];
    }

    try {
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Get total count of matching documents
        const totalJobs = await GovtJob.countDocuments(query);

        // Get paginated results with sorting
        const govtJobs = await GovtJob.find(query)
            .skip(skip)
        .limit(parseInt(limit))
        .sort({ _id: -1 });

        res.status(200).json({
            success: true,
            govtJobs,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalJobs / limit),
            totalJobs,
        });
    } catch (error) {
        return next(new ErrorHandler("Error fetching government jobs.", 500));
    }
});

export const getASingleGovtJob = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const job = await GovtJob.findById(id);

    if (!job) {
        return next(new ErrorHandler("Job not found.", 404));
    }

    res.status(200).json({
        success: true,
        job,
    });
});

export const getLatestGovtJobs = catchAsyncErrors(async (req, res, next) => {
  const govtJobs = await GovtJob.find()
    .sort({ _id: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    govtJobs
  });
});

export const deleteGovtJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const job = await GovtJob.findById(id);
  
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }
  
  await job.deleteOne();
  
  res.status(200).json({
    success: true,
    message: "GovtJob deleted successfully."
  });
});

export const updateGovtJob = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    const job = await GovtJob.findById(id);
    if (!job) {
        return next(new ErrorHandler("Government Job not found", 404));
    }

    const updatedJob = await GovtJob.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        job: updatedJob,
        message: "Government Job updated successfully"
    });
});

export const createGovtJob = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            job_type,
            department,
            location,
            organization,
            post_date,
            eligibility_criteria,
            application_link,
            salary_range,
            last_date,
            valid_until,
            result_link,
            description,
            qualifications,
            role,
            vacancy,
            post,
            notification_about
        } = req.body;

        // Validate required fields
        const requiredFields = [
            'job_type',
            'department',
            'location',
            'organization',
            'application_link',
            'last_date',
            'valid_until',
            'result_link',
            'description',
            'qualifications',
            'role',
            'vacancy',
            'post',
            'notification_about'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return next(new ErrorHandler(`Missing required fields: ${missingFields.join(', ')}`, 400));
        }

        // Convert date strings to Date objects
        const formattedData = {
            ...req.body,
            post_date: new Date(post_date),
            last_date: new Date(last_date),
            valid_until: valid_until ? new Date(valid_until) : undefined
        };

        const newGovtJob = await GovtJob.create(formattedData);
        
        res.status(201).json({
            success: true,
            govtJob: newGovtJob,
            message: "Government Job created successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});