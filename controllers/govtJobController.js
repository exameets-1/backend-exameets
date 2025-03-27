import mongoose from "mongoose";
import { GovtJob } from "../models/govtJobSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";


export const getAllGovtJobs = catchAsyncErrors(async (req, res, next) => {
    const { location, sort, searchKeyword, page = 1, limit = 8 } = req.query;
    const query = {};

    // Location filter
    if (location && location !== "All") {
        query.jobLocation = { $regex: location, $options: "i" };
    }

    // Search logic
    if (searchKeyword) {
        query.$or = [
            { jobTitle: { $regex: searchKeyword, $options: "i" } },
            { organization: { $regex: searchKeyword, $options: "i" } },
            { jobLocation: { $regex: searchKeyword, $options: "i" } },
            { postNames: { $regex: searchKeyword } },
            { notification_about: { $regex: searchKeyword } },
            { jobOverview: { $regex: searchKeyword } }
        ];
    }

    // Sorting logic
    let sortOptions = {};
    if (sort === 'recent') {
        sortOptions.notificationReleaseDate = -1; // Recent first
    } else if (sort === 'deadline') {
        sortOptions.applicationEndDate = 1; // Nearest deadline first
    }

    const skip = (page - 1) * limit;
    const totalJobs = await GovtJob.countDocuments(query);

    const govtJobs = await GovtJob.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        govtJobs,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
    });
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
    let updates = req.body;

    // Validate main job ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid job ID", 400));
    }

    // Validate FAQ data
    if (updates.faq) {
        if (!Array.isArray(updates.faq)) {
            return next(new ErrorHandler("FAQ must be an array", 400));
        }
        updates.faq = updates.faq.map(faq => {
            if (!faq.question || !faq.answer) {
                throw new ErrorHandler("Each FAQ must have both question and answer", 400);
            }
            return {
                ...faq,
                _id: mongoose.Types.ObjectId.isValid(faq._id) 
                    ? faq._id 
                    : new mongoose.Types.ObjectId()
            };
        });
    }

    try {
        const updatedJob = await GovtJob.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedJob) {
            return next(new ErrorHandler("Government Job not found", 404));
        }

        res.status(200).json({
            success: true,
            job: updatedJob
        });
    } catch (error) {
        console.error('Update error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors)
                .map(err => err.message)
                .join(', ');
            return next(new ErrorHandler(`Validation failed: ${validationErrors}`, 400));
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const key = Object.keys(error.keyValue)[0];
            return next(new ErrorHandler(`Duplicate value for ${key}`, 400));
        }

        // Handle other errors
        return next(new ErrorHandler(error.message || "Failed to update job", 500));
    }
});

export const createGovtJob = catchAsyncErrors(async (req, res, next) => {
  try {
      // Destructure all fields from request body according to schema
      const {
          jobTitle,
          slug,
          jobOverview,
          year,
          organization,
          postNames,
          totalVacancies,
          applicationMode,
          jobLocation,
          officialWebsite,
          notification_about,
          notificationReleaseDate,
          applicationStartDate,
          applicationEndDate,
          examInterviewDate,
          educationalQualifications,
          ageLimitMin,
          ageLimitMax,
          ageRelaxation,
          additionalRequirements,
          vacancyPostNames,
          vacancyCounts,
          vacancyPayScales,
          applicationFeeGeneral,
          applicationFee_SC_ST_PWD,
          applicationFeePaymentMode,
          selectionProcess,
          howToApplyOnlineSteps,
          howToApplyOfflineSteps,
          requiredDocuments,
          examSubjects,
          examQuestionCounts,
          examMarks,
          examDurations,
          notificationPDFLink,
          applyOnlineLink,
          officialWebsiteLink,
          keywords,
          searchDescription,
          isFeatured,
          faq
      } = req.body;

      // Validate required fields based on schema
      const requiredFields = [
          'jobTitle',
          'slug',
          'organization',
          'notification_about',
          'applicationStartDate',
          'applicationEndDate',
          'totalVacancies'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
          return next(new ErrorHandler(`Missing required fields: ${missingFields.join(', ')}`, 400));
      }

      // Create the job with all fields
      const newGovtJob = await GovtJob.create({
          jobTitle,
          slug,
          jobOverview,
          year,
          organization,
          postNames,
          totalVacancies,
          applicationMode,
          jobLocation,
          officialWebsite,
          notification_about,
          notificationReleaseDate,
          applicationStartDate,
          applicationEndDate,
          examInterviewDate,
          educationalQualifications,
          ageLimitMin,
          ageLimitMax,
          ageRelaxation,
          additionalRequirements,
          vacancyPostNames,
          vacancyCounts,
          vacancyPayScales: vacancyPayScales,
          applicationFeeGeneral,
          applicationFee_SC_ST_PWD,
          applicationFeePaymentMode,
          selectionProcess,
          howToApplyOnlineSteps,
          howToApplyOfflineSteps,
          requiredDocuments,
          examSubjects,
          examQuestionCounts,
          examMarks,
          examDurations,
          notificationPDFLink,
          applyOnlineLink,
          officialWebsiteLink,
          keywords,
          searchDescription,
          isFeatured,
          faq
      });

      res.status(201).json({
          success: true,
          govtJob: newGovtJob,
          message: "Government Job created successfully"
      });
  } catch (error) {
      return next(new ErrorHandler(error.message, 500));
  }
});