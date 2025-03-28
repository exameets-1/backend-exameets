import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Internship } from "../models/internshipSchema.js";


export const getAllInternships = catchAsyncErrors(async(req, res, next) => {
    const { 
        searchKeyword, 
        city, 
        internship_type, 
        page = 1, 
        limit = 8,
    } = req.query;

    const query = {};
    
    // Location filter with exact and nearby matches
    if (city && city !== "All") {
        query.location = { 
            $regex: city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            $options: "i" 
        };
    }
    
    // Internship type filter
    if (internship_type && internship_type !== "All") {
        query.internship_type = { 
            $regex: internship_type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            $options: "i" 
        };
    }

    //  Enhanced search functionality
    if (searchKeyword) {
        const searchRegex = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
            { title: { $regex: searchRegex, $options: "i" } },
            { organization: { $regex: searchRegex, $options: "i" } },
            { location: { $regex: searchRegex, $options: "i" } },
            { description: { $regex: searchRegex, $options: "i" } },
            { skills_required: { $regex: searchRegex, $options: "i" } },
            { field: { $regex: searchRegex, $options: "i" } },
            { qualification: { $regex: searchRegex, $options: "i" } },
            { internship_type: { $regex: searchRegex, $options: "i" } },
            { searchDescription: { $regex: searchRegex, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;
    const totalInternships = await Internship.countDocuments(query);

    const internships = await Internship.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        internships,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalInternships / limit),
        totalInternships,
    });
});

export const getASingleInternship = catchAsyncErrors(async(req, res, next) => {
    const { id } = req.params;
    const internship = await Internship.findById(id);

    if (!internship) {
        return next(new ErrorHandler("Internship not found", 404));
    }
    res.status(200).json({
        success: true,
        internship
    });
});

export const createInternship = catchAsyncErrors(async(req, res, next) => {
    const requiredFields = [
        'slug', 'title'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        return next(new ErrorHandler(
            `Missing required fields: ${missingFields.join(', ')}`,
            400
        ));
    }

    const internship = await Internship.create({
        ...req.body,
        keywords: req.body.keywords || [],
        searchDescription: req.body.searchDescription || req.body.description.substring(0, 150),
        createdAt: new Date(),
        postedBy : req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Internship created successfully",
        internship
    });
});

export const getLatestInternships = catchAsyncErrors(async (req, res, next) => {
    const internships = await Internship.find()
        .sort({ createdAt: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        internships
    });
});

export const deleteInternship = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const internship = await Internship.findOne({ _id: id });

    if (!internship) {
        return next(new ErrorHandler("Internship not found", 404));
    }

    await internship.deleteOne();

    res.status(200).json({
        success: true,
        message: "Internship deleted successfully"
    });
});

export const updateInternship = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    const internship = await Internship.findOneAndUpdate(
        { _id: id },
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!internship) {
        return next(new ErrorHandler("Internship not found", 404));
    }

    res.status(200).json({
        success: true,
        internship,
        message: "Internship updated successfully"
    });
});