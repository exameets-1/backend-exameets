import {catchAsyncErrors} from '../middlewares/catchAsyncErrors.js'
import ErrorHandler from '../middlewares/error.js'
import {PreviousYear} from '../models/previousYearSchema.js'

export const getAllPreviousYears = catchAsyncErrors(async(req, res, next) => {
    const {searchKeyword, page = 1, limit = 4} = req.query;

    const query = {}
    if(searchKeyword){
        query.$or = [
        
            {subject : {$regex: searchKeyword, $options: "i"}},
            {organization : {$regex: searchKeyword, $options: "i"}}
        ]
    }
    const skip = (page -1) * limit;
    const totalPreviousYears = await PreviousYear.countDocuments(query)

    const previousYears = await PreviousYear.find(query)
    .sort({_id : -1})
    .skip(skip)
    .limit(parseInt(limit));
    

    res.status(200).json({
        success : true,
        previousYears,
        currentPage: parseInt(page),
        totalPages : Math.ceil(totalPreviousYears/limit),
        totalPreviousYears
    })
})

export const getASinglePreviousYear = catchAsyncErrors(async(req, res, next) => {
    const {id} = req.params;
    const previousYear = await PreviousYear.findById(id);

    if(!previousYear){
        return next(new ErrorHandler("Previous Year Papers not found"));

    }
    res.status(200).json({
        success : true,
        previousYear
    })
})

export const deletePreviousYear = catchAsyncErrors(async(req, res, next) => {
    const {id} = req.params;
    const previousYear = await PreviousYear.findById(id);
    if(!previousYear){
        return next(new ErrorHandler("Previous Year Papers not found"));
    }
    await previousYear.deleteOne();
    res.status(200).json({
        success : true,
        message : "Previous Year Papers deleted successfully"
    })
})

export const updatePreviousYear = catchAsyncErrors(async(req, res, next) => {
    const { id } = req.params;
    const previousYear = await PreviousYear.findById(id);
    
    if(!previousYear) {
        return next(new ErrorHandler("Previous Year Paper not found"));
    }

    const updatedPreviousYear = await PreviousYear.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        previousYear: updatedPreviousYear,
        message: "Previous Year Paper updated successfully"
    });
});

export const getLatestPreviousYears = catchAsyncErrors(async(req, res, next) => {
    const previousYears = await PreviousYear.find()
    .sort({ _id: -1 })
    .limit(5);

    res.status(200).json({
        success : true,
        previousYears
    })
})

export const createPreviousYear = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        exam_name,
        description,
        subject,
        year,
        difficulty_level,
        category,
        paper_link,
        solution_link,
        is_featured
    } = req.body;

    const previousYear = await PreviousYear.create({
        title,
        exam_name,
        description,
        subject,
        year,
        difficulty_level,
        category,
        paper_link,
        solution_link,
        is_featured,
        post_date: new Date()
    });

    res.status(201).json({
        success: true,
        message: "Previous year paper created successfully",
        previousYear
    });
});