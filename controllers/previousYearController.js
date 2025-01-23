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