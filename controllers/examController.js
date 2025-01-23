import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { Exam } from '../models/examSchema.js';

export const getAllExams = catchAsyncErrors(async (req, res, next) => {
    const { searchKeyword, page = 1, limit = 6 } = req.query;

    const query = {};
    if (searchKeyword) {
        query.$or = [
            { title: { $regex: searchKeyword, $options: "i" } },
            { organization: { $regex: searchKeyword, $options: "i" } },
            { description: { $regex: searchKeyword, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;
    const totalExams = await Exam.countDocuments(query);

    const exams = await Exam.find(query)
        .sort({ post_date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        exams,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalExams / limit),
        totalExams
    });
});

export const getSingleExam = catchAsyncErrors(async (req, res, next) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        return next(new ErrorHandler("Exam not found", 404));
    }

    res.status(200).json({
        success: true,
        exam
    });
});

/*export const createExam = catchAsyncErrors(async (req, res, next) => {
    const exam = await Exam.create(req.body);

    res.status(201).json({
        success: true,
        exam
    });
});

export const updateExam = catchAsyncErrors(async (req, res, next) => {
    let exam = await Exam.findById(req.params.id);

    if (!exam) {
        return next(new ErrorHandler("Exam not found", 404));
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        exam
    });
});

export const deleteExam = catchAsyncErrors(async (req, res, next) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        return next(new ErrorHandler("Exam not found", 404));
    }

    await exam.deleteOne();

    res.status(200).json({
        success: true,
        message: "Exam deleted successfully"
    });
});*/