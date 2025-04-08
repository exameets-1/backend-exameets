import {Team} from "../models/teamSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

export const createTeam = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            name,
            position,
            image,
            description,
            strengths,
            duration,
            linkedin,
            github,
            certificates
        } = req.body;

        // Create team with approved set to false by default (comes from schema)
        const team = await Team.create({
            name,
            position,
            image,
            description,
            strengths,
            duration,
            linkedin,
            github,
            certificates,
            approved: false
        });

        res.status(200).json({
            success: true,
            message: "Team created successfully",
            team
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getAllTeams = catchAsyncErrors(async(req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 100;
        const skip = (page - 1) * limit;

        let query = { approved: true }; // Default to show only approved teams

        // If explicitly requesting pending teams
        if (req.query.status === 'pending') {
            query = { approved: false };
        } else if (req.query.status === 'all') {
            delete query.approved; // Remove the filter to get all teams
        }

        if (req.query.keyword) {
            query.$or = [
                {name: {$regex: req.query.keyword, $options: 'i'}}
            ];
        }

        const totalTeams = await Team.countDocuments(query);
        const teams = await Team.find(query)
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalTeams/limit);
        res.status(200).json({
            success: true,
            teams,
            currentPage: page,
            totalPages,
            totalTeams,
            message: 'Teams fetched successfully'
        });
    } catch(error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getASingleTeam = catchAsyncErrors(async(req, res, next)=>{
    const {id} = req.params;
    const team = await Team.findById(id);
    if(!team){
        return next(new ErrorHandler("Team Not Found", 400));
    }

    res.status(200).json({
        success: true,
        team,
    });
});

export const approveTeam = catchAsyncErrors(async(req, res, next) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id);
        
        if (!team) {
            return next(new ErrorHandler("Team Not Found", 404));
        }
        
        team.approved = true;
        await team.save();
        
        res.status(200).json({
            success: true,
            message: "Team member approved successfully",
            team
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const deleteTeam = catchAsyncErrors(async(req, res, next)=>{
    const {id} = req.params;
    const team = await Team.findById(id);
    if(!team){
        return next(new ErrorHandler("Team Not Found", 400));
    }

    await team.deleteOne();
    res.status(200).json({
        success: true,
        message: "Team deleted successfully"
    });
});