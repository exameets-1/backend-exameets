import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { PreviousYear } from '../models/previousYearSchema.js';

// Get All Unique Subjects for /pyqs Page
export const getAllSubjects = catchAsyncErrors(async (req, res, next) => {
    const subjects = await PreviousYear.distinct("subject");

    if (!subjects.length) {
        return next(new ErrorHandler("No subjects found", 404));
    }

    res.status(200).json({
        success: true,
        subjects
    });
});

// Get All Papers of a Subject Grouped by Year for /pyqs/:subjectSlug
export const getPapersBySubject = catchAsyncErrors(async (req, res, next) => {
    const { subjectSlug } = req.params;
    const decodedSubject = decodeURIComponent(subjectSlug);

    const papers = await PreviousYear.find({ subject: decodedSubject }).sort({ year: -1 });

    if (!papers.length) {
        return next(new ErrorHandler(`No papers found for this subject :${subjectSlug}`, 404));
    }

    // Group papers by year
    const papersByYear = papers.reduce((acc, paper) => {
        if (!acc[paper.year]) {
            acc[paper.year] = [];
        }
        acc[paper.year].push(paper);
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        subject: decodedSubject,
        papersByYear
    });
});

// Get Papers of a Subject for a Specific Year for /pyqs/:subjectSlug/:year
export const getPapersBySubjectAndYear = catchAsyncErrors(async (req, res, next) => {
    const { subjectSlug, year } = req.params;
    const decodedSubject = decodeURIComponent(subjectSlug);

    const papers = await PreviousYear.find({ subject: decodedSubject, year: parseInt(year) });

    if (!papers.length) {
        return next(new ErrorHandler("No papers found for this subject and year", 404));
    }

    res.status(200).json({
        success: true,
        subject: decodedSubject,
        year: parseInt(year),
        papers
    });
});

// Get Latest Papers
export const getLatestPapers = catchAsyncErrors(async (req, res, next) => {
    const papers = await PreviousYear.find().sort({ createdAt: -1 }).limit(5); // Fetch the latest 5 papers

    if (!papers.length) {
        return next(new ErrorHandler("No papers found", 404));
    }

    res.status(200).json({
        success: true,
        papers, // Return the latest papers
    });
});

// Add a New Paper (Admin Only)
export const addPaper = catchAsyncErrors(async (req, res, next) => {
    const { title, subject, year, paper_link, solution_link, difficulty_level, exam_name, category, slug, is_featured, keywords , description, searchDescription } = req.body;

    if (!title || !subject || !year || !paper_link) {
        return next(new ErrorHandler("Title, subject, year, and paper link are required", 400));
    }

    const paper = await PreviousYear.create({
        title,
        subject,
        year,
        paper_link,
        solution_link,
        difficulty_level,
        exam_name,
        category,
        slug,
        is_featured,
        keywords,
        description,
        searchDescription,
        createdAt: new Date(),
    });

    res.status(201).json({
        success: true,
        message: "Paper added successfully",
        paper,
    });
});

// Delete a Paper (Admin Only)
export const deletePaper = catchAsyncErrors(async (req, res, next) => {
    const { paperId } = req.params;

    const paper = await PreviousYear.findById(paperId);

    if (!paper) {
        return next(new ErrorHandler("Paper not found", 404));
    }

    // Use deleteOne instead of remove
    await PreviousYear.deleteOne({ _id: paperId });

    res.status(200).json({
        success: true,
        message: "Paper deleted successfully",
    });
});

// Update a Paper (Admin Only)
export const updatePaper = catchAsyncErrors(async (req, res, next) => {
    const { paperId } = req.params;
    const updates = req.body;

    const paper = await PreviousYear.findById(paperId);

    if (!paper) {
        return next(new ErrorHandler("Paper not found", 404));
    }

    Object.keys(updates).forEach((key) => {
        paper[key] = updates[key];
    });

    await paper.save();

    res.status(200).json({
        success: true,
        message: "Paper updated successfully",
        paper,
    });
});

