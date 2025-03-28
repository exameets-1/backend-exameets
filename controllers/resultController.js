import { Result } from "../models/resultSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllResults = catchAsyncErrors(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        let query = {};

        if (req.query.keyword) {
            query.$or = [
                { title: { $regex: req.query.keyword, $options: 'i' } },
                { organization: { $regex: req.query.keyword, $options: 'i' } },
                { postName: { $regex: req.query.keyword, $options: 'i' } }
            ];
        }

        const totalResults = await Result.countDocuments(query);
        const results = await Result.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalResults / limit);
        res.status(200).json({
            success: true,
            results,
            currentPage: page,
            totalPages,
            totalResults,
            message: "Results fetched successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getASingleResult = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const result = await Result.findById(id);

    if (!result) {
        return next(new ErrorHandler("Result not found", 404));
    }

    res.status(200).json({
        success: true,
        result
    });
});

export const getLatestResults = catchAsyncErrors(async (req, res, next) => {
    const results = await Result.find()
        .sort({ _id: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        results
    });
});

export const deleteResult = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const result = await Result.findById(id);

    if (!result) {
        return next(new ErrorHandler("Result not found", 404));
    }

    await result.deleteOne();

    res.status(200).json({
        success: true,
        message: "Result deleted successfully"
    });
});

export const updateResult = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const result = await Result.findById(id);

    if (!result) {
        return next(new ErrorHandler("Result not found", 404));
    }

    const updatedResult = await Result.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        result: updatedResult,
        message: "Result updated successfully"
    });
});

export const createResult = catchAsyncErrors(async (req, res, next) => {
    try {
        const { totalVacancies } = req.body;

        if (!totalVacancies) {
            return next(new ErrorHandler("Total Vacancies is a required field", 400));
        }

        const newResult = await Result.create({
            ...req.body,
            keywords: req.body.keywords || [],
            searchDescription: req.body.searchDescription || req.body.description.substring(0, 150),
            createdAt: new Date(),
            postedBy : req.user._id
        });

        res.status(201).json({
            success: true,
            result: newResult,
            message: "Result created successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});