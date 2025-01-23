import { Result } from "../models/resultSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllResults = catchAsyncErrors(async (req, res, next) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page -1) * limit;

        let query = {};

        if(req.query.keyword){ 
            query.$or = [
                {exam_title : {$regex: req.query.keyword, $options: 'i'}}
            ];
        }
        const totalResults = await Result.countDocuments(query);
        const results = await Result.find(query)
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)

        const totalPages = Math.ceil(totalResults/limit);
        res.status(200).json({
            success : true,
            results,
            currentPage : page,
            totalPages,
            totalResults,
            message : "Results fetched successfully"
        });
    }catch(error){
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getASingleResult = catchAsyncErrors(async (req, res, next) => {
    const {id} = req.params;
    const result = await Result.findById(id);

    if(!result){
        return next(new ErrorHandler("Result not found", 404));
    }

    res.status(200).json({
        success :true,
        result
    })
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