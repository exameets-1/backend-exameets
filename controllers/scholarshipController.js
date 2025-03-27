import { Scholarship } from "../models/scholarshipSchema.js";
import ErrorHandler from "../middlewares/error.js";
import {catchAsyncErrors} from "../middlewares/catchAsyncErrors.js";

// Create new scholarship
export const createScholarship = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        organization,
        description,
        eligibility_criteria,
        amount,
        application_link,
        start_date,
        last_date,
        category,
        qualification,
        is_featured,
        keywords,
        searchDescription,
        slug
    } = req.body;

    const scholarship = await Scholarship.create({
        title,
        organization,
        description,
        eligibility_criteria,
        amount,
        application_link,
        start_date,
        last_date,
        category,
        qualification,
        is_featured,
        keywords,
        searchDescription,
        slug
    });

    res.status(201).json({
        success: true,
        message: "Scholarship created successfully",
        scholarship
    });
});

// Get all scholarships with pagination and search
export const getAllScholarships = catchAsyncErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    const searchKeyword = req.query.searchKeyword || "";
    const category = req.query.category || "All";
    const qualification = req.query.qualification || "All";

    const searchQuery = {};

    // Add search keyword filter
    if (searchKeyword) {
        searchQuery.$or = [
            { title: { $regex: searchKeyword, $options: "i" } },
            { description: { $regex: searchKeyword, $options: "i" } },
            { organization: { $regex: searchKeyword, $options: "i" } },
            { qualification: { $regex: searchKeyword, $options: "i" } },
            { category: { $regex: searchKeyword, $options: "i" } },
        ];
    }

    // Add category filter
    if (category !== "All") {
        searchQuery.category = category;
    }

    // Add qualification filter
    if (qualification !== "All") {
        searchQuery.qualification = qualification;
    }

    const totalScholarships = await Scholarship.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalScholarships / limit);

    const scholarships = await Scholarship.find(searchQuery)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        scholarships,
        currentPage: page,
        totalPages,
        totalScholarships,
    });
});

// Get single scholarship
export const getASingleScholarship = catchAsyncErrors(async (req, res, next) => {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
        return next(new ErrorHandler("Scholarship not found", 404));
    }

    res.status(200).json({
        success: true,
        scholarship
    });
});

// Get latest scholarships
export const getLatestScholarships = catchAsyncErrors(async (req, res, next) => {
  const scholarships = await Scholarship.find()
    .sort({ _id: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    scholarships
  });
});

// Update scholarship
export const updateScholarship = catchAsyncErrors(async (req, res, next) => {
    let scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
        return next(new ErrorHandler("Scholarship not found", 404));
    }

    scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        scholarship
    });
});

// Delete scholarship
export const deleteScholarship = catchAsyncErrors(async (req, res, next) => {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
        return next(new ErrorHandler("Scholarship not found", 404));
    }

    await scholarship.deleteOne();

    res.status(200).json({
        success: true,
        message: "Scholarship deleted successfully"
    });
});
