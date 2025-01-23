import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Internship } from "../models/internshipSchema.js";

export const getAllInternships = catchAsyncErrors(async(req, res, next) => {
    const {searchKeyword, page= 1, limit = 8 } = req.query;

    const query = {};
   /* if(city){
        query.location = {$regex : city, $options : "i"};
    }
    if(niche) {
        query.niche = niche;
    }*/
    if(searchKeyword){
        query.$or = [
            {internship_type : {$regex: searchKeyword, $options: "i"}},
            {organization : {$regex: searchKeyword, $options: "i"}},
            {location : {$regex: searchKeyword, $options: "i"}},
            {description : {$regex: searchKeyword, $options: "i"}},
            {skills_required : {$regex: searchKeyword, $options: "i"}}

        ];
    }
    const skip = (page -1)* limit;

    const totalInternships = await Internship.countDocuments(query);

    const internships = await Internship.find(query)
    .skip(skip)
    .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        internships,
        currentPage: parseInt(page),
        totalPages : Math.ceil(totalInternships/limit),
        totalInternships
    })
});

export const getASingleInternship = catchAsyncErrors(async(req, res, next)=>{
    const {id} = req.params;
    const internship = await Internship.findById(id);

    if(!internship){
        return next(new ErrorHandler("Internship not found", 404));
    }
    res.status(200).json({
        success :true,
        internship
    })
})

export const getLatestInternships = catchAsyncErrors(async (req, res, next) => {
  const internships = await Internship.find()
    .sort({ _id: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    internships
  });
});
