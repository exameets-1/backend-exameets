import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { Admission } from '../models/admissionSchema.js';

export const getAllAdmissions = catchAsyncErrors(async (req, res, next) => {
    const { 
        searchKeyword, 
        category, 
        location,
        page = 1, 
        limit = 8,
        sortBy = 'last_date',
        sortOrder = 'asc'
    } = req.query;

    try {
        // Build query
        const query = {};

        // Search functionality
        if (searchKeyword) {
            const searchRegex = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { title: { $regex: searchRegex, $options: "i" } },
                { description: { $regex: searchRegex, $options: "i" } },
                { institute: { $regex: searchRegex, $options: "i" } },
                { course: { $regex: searchRegex, $options: "i" } },
                { location: { $regex: searchRegex, $options: "i" } },
                { category: { $regex: searchRegex, $options: "i" } },
                { eligibility_criteria: { $regex: searchRegex, $options: "i" } }
            ];
        }

        // Category filter
        if (category && category !== "All") {
            query.category = { $regex: category, $options: "i" };
        }

        // Location filter
        if (location && location !== "All") {
            query.location = { $regex: location, $options: "i" };
        }

        // Optional: Only show active/upcoming admissions if specified
        if (req.query.showActiveOnly === 'true') {
            query.last_date = { $gte: new Date() };
        }

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Limit between 1 and 50
        const skip = (pageNum - 1) * limitNum;

        // Count total matching documents
        const totalAdmissions = await Admission.countDocuments(query);
        const totalPages = Math.ceil(totalAdmissions / limitNum);

        // Validate sort parameters
        const allowedSortFields = ['last_date', 'start_date', 'post_date'];
        const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'last_date';
        const finalSortOrder = sortOrder === 'desc' ? -1 : 1;

        // Fetch admissions with sorting and pagination
        const admissions = await Admission.find(query)
            .sort({ [finalSortBy]: finalSortOrder })
            .skip(skip)
            .limit(limitNum)
            .select('-__v')
            // Exclude version key

        // Get unique categories for filtering
        const categories = await Admission.distinct('category');

        // Calculate pagination metadata
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        const nextPage = hasNextPage ? pageNum + 1 : null;
        const prevPage = hasPrevPage ? pageNum - 1 : null;

        res.status(200).json({
            success: true,
            admissions,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalAdmissions,
                hasNextPage,
                hasPrevPage,
                nextPage,
                prevPage,
                limit: limitNum
            },
            filters: {
                categories,
                availableSortFields: allowedSortFields
            }
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getSingleAdmission = catchAsyncErrors(async (req, res, next) => {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
        return next(new ErrorHandler("Admission not found", 404));
    }

    res.status(200).json({
        success: true,
        admission
    });
});

export const getLatestAdmissions = catchAsyncErrors(async (req, res, next) => {
    const admissions = await Admission.find()
      .sort({ _id: -1 })
      .limit(5);
  
    res.status(200).json({
      success: true,
      admissions
    });
  });
  
  export const deleteAdmission = catchAsyncErrors(async (req, res, next) => {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
        return next(new ErrorHandler("Admission not found", 404));
    }

    await admission.deleteOne();

    res.status(200).json({
        success: true,
        message: "Admission deleted successfully"
    });
});

export const createAdmission = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        institute,
        description,
        eligibility_criteria,
        course,
        application_link,
        start_date,
        last_date,
        category,
        fees,
        location,
        is_featured
    } = req.body;

    const admission = await Admission.create({
        title,
        institute,
        description,
        eligibility_criteria,
        course,
        application_link,
        start_date,
        last_date,
        category,
        fees,
        location,
        is_featured,
        post_date: new Date()
    });

    res.status(201).json({
        success: true,
        message: "Admission created successfully",
        admission
    });
});

export const updateAdmission = catchAsyncErrors(async (req, res, next) => {
    let admission = await Admission.findById(req.params.id);

    if (!admission) {
        return next(new ErrorHandler("Admission not found", 404));
    }

    admission = await Admission.findByIdAndUpdate(req.params.id, 
        { 
            ...req.body,
            lastUpdated: Date.now()
        }, 
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        admission
    });
});

// Additional utility functions

export const getAdmissionsByInstitution = catchAsyncErrors(async (req, res, next) => {
    const { institution } = req.params;
    const admissions = await Admission.find({ 
        institution: { $regex: institution, $options: "i" }
    }).sort({ applicationDeadline: 1 });

    res.status(200).json({
        success: true,
        admissions
    });
});

export const getUpcomingDeadlines = catchAsyncErrors(async (req, res, next) => {
    const currentDate = new Date();
    const admissions = await Admission.find({
        applicationDeadline: { $gt: currentDate },
        status: 'Open'
    })
    .sort({ applicationDeadline: 1 })
    .limit(10);

    res.status(200).json({
        success: true,
        admissions
    });
});

export const getAdmissionsByLocation = catchAsyncErrors(async (req, res, next) => {
    const { state } = req.params;
    const admissions = await Admission.find({
        'location.state': { $regex: state, $options: "i" }
    }).sort({ applicationDeadline: 1 });

    res.status(200).json({
        success: true,
        admissions
    });
});

// Get latest admissions