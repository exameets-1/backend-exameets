import WhatsNew from '../models/whatsNewSchema.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import {Job} from '../models/jobSchema.js';
import {Internship} from '../models/internshipSchema.js';

import {Exam }from '../models/examSchema.js';
import {Admission } from '../models/admissionSchema.js';

// Add new item to What's New
export const addToWhatsNew = catchAsyncErrors(async (req, res, next) => {
    const { title, type, itemId } = req.body;

    const whatsNew = await WhatsNew.create({
        title,
        type,
        itemId
    });

    res.status(201).json({
        success: true,
        whatsNew
    });
});

// Get all What's New items
export const getWhatsNew = catchAsyncErrors(async (req, res, next) => {
    const whatsNewItems = await WhatsNew.find()
        .sort({ addedAt: -1 });

    // Populate the details for each item based on its type
    const populatedItems = await Promise.all(whatsNewItems.map(async (item) => {
        let detailsModel;
        switch (item.type) {
            case 'job':
                detailsModel = Job;
                break;
            case 'internship':
                detailsModel = Internship;
                break;
            case 'course':
                detailsModel = Course;
                break;
            case 'exam':
                detailsModel = Exam;
                break;
            case 'admission':
                detailsModel = Admission;
                break;
            default:
                return item;
        }

        const details = await detailsModel.findById(item.itemId);
        return {
            ...item.toObject(),
            details: details ? {
                _id: details._id,
                title: details.title,
                company: details.company, // for jobs/internships
                institution: details.institution, // for courses/exams/admissions
                location: details.location,
                status: details.status
            } : null
        };
    }));

    res.status(200).json({
        success: true,
        whatsNew: populatedItems
    });
});

// Delete a What's New item
export const deleteWhatsNewItem = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const whatsNew = await WhatsNew.findById(id);
    if(!whatsNew){
        return next(new ErrorHandler("What's New not found", 404));
    }
    await whatsNew.deleteOne();
    res.status(200).json({
        success: true,
        message: "What's New deleted successfully"
    });
});