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
        sortBy = 'post_date',
        sortOrder = 'desc',
        field = 'All'
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

    // Field filter
    if (field && field !== "All") {
        query.field = { 
            $regex: field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            $options: "i" 
        };
    }

    // Enhanced search functionality
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
            { eligibility_criteria: { $regex: searchRegex, $options: "i" } },
            { internship_type: { $regex: searchRegex, $options: "i" } }
        ];
    }

    try {
        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Limit between 1 and 50
        const skip = (pageNum - 1) * limitNum;

        // Count total matching documents
        const totalInternships = await Internship.countDocuments(query);
        const totalPages = Math.ceil(totalInternships / limitNum);

        // Validate sortBy field
        const allowedSortFields = ['post_date', 'start_date', 'last_date', 'stipend'];
        const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'post_date';
        const finalSortOrder = sortOrder === 'asc' ? 1 : -1;

        // Fetch internships with sorting and pagination
        const internships = await Internship.find(query)
            .sort({ [finalSortBy]: finalSortOrder })
            .skip(skip)
            .limit(limitNum)
            .select('-__v'); // Exclude version key

        // Calculate pagination metadata
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        const nextPage = hasNextPage ? pageNum + 1 : null;
        const prevPage = hasPrevPage ? pageNum - 1 : null;

        res.status(200).json({
            success: true,
            internships,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalInternships,
                hasNextPage,
                hasPrevPage,
                nextPage,
                prevPage,
                limit: limitNum
            },
            filters: {
                city: city || 'All',
                internship_type: internship_type || 'All',
                field: field || 'All',
                sortBy: finalSortBy,
                sortOrder: sortOrder
            }
        });
    } catch (error) {
        return next(new ErrorHandler("Error fetching internships: " + error.message, 500));
    }
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
    const {
        internship_type,
        title,
        start_date,
        duration,
        skills_required,
        stipend,
        organization,
        location,
        qualification,
        eligibility_criteria,
        application_link,
        last_date,
        is_featured,
        field,
        description
    } = req.body;

    if (!internship_type || !title || !start_date || !duration || !skills_required || 
        !stipend || !organization || !location || !qualification || !eligibility_criteria || 
        !application_link || !last_date || !field || !description) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
    }

    const internship = await Internship.create({
        internship_type,
        title,
        start_date,
        duration,
        skills_required,
        stipend,
        post_date: new Date(),
        organization,
        location,
        qualification,
        eligibility_criteria,
        application_link,
        last_date,
        is_featured: is_featured || false,
        field,
        description
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
    const internship = await Internship.findById(id);

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

    const internship = await Internship.findById(id);
    if (!internship) {
        return next(new ErrorHandler("Internship not found", 404));
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        internship: updatedInternship,
        message: "Internship updated successfully"
    });
});
