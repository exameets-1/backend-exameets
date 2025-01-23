import {Team} from "../models/teamSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllTeams = catchAsyncErrors(async(req, res , next) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = 100;
        const skip = (page -1) * limit;

        let query = {};

        if(req.query.keyword){
            query.$or = [
                {name : {$regex: req.query.keyword, $options: 'i'}}
            ];
        }
        const totalTeams = await Team.countDocuments(query);
        const teams = await Team.find(query)
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)

        const totalPages = Math.ceil(totalTeams/limit);
        res.status(200).json({
            success : true,
            teams,
            currentPage : page,
            totalPages,
            totalTeams,
            message: 'Teams fetched successfully'
        })
    } catch(error){
        return next(new ErrorHandler(error.message, 500));
    }
})

export const getASingleTeam = catchAsyncErrors(async(req, res, next)=>{
    const {id} = req.params;
    const team = await Team.findById(id);
    if(!team){
        return next(new ErrorHandler("Team Not Found", 400));
    }

    res.status(200).json({
        success :true,
        team,
    })
})
