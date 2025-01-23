import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { Admission } from '../models/admissionSchema.js';

export const getAllAdmissions = catchAsyncErrors(async (req, res, next) => {
    const { searchKeyword, category, status, page = 1, limit = 8 } = req.query;

    const query = {};
    if (searchKeyword) {
        query.$or = [
            { title: { $regex: searchKeyword, $options: "i" } },
            { description: { $regex: searchKeyword, $options: "i" } },
            { institution: { $regex: searchKeyword, $options: "i" } },
            { program: { $regex: searchKeyword, $options: "i" } },
            { "location.city": { $regex: searchKeyword, $options: "i" } },
            { "location.state": { $regex: searchKeyword, $options: "i" } }
        ];
    }

    if (category) {
        query.category = { $regex: category, $options: "i" };
    }

    if (status) {
        query.status = status;
    }

    const skip = (page - 1) * limit;
    const totalAdmissions = await Admission.countDocuments(query);

    const admissions = await Admission.find(query)
        .sort({ applicationDeadline: 1, post_date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Get unique categories for filtering
    const allCategories = await Admission.distinct('category');

    res.status(200).json({
        success: true,
        admissions,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAdmissions / limit),
        totalAdmissions,
        categories: allCategories
    });
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
  
/*export const createAdmission = catchAsyncErrors(async (req, res, next) => {
    const admission = await Admission.create(req.body);

    res.status(201).json({
        success: true,
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
*/