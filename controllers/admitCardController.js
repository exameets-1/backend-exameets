import { AdmitCard } from "../models/admitCardSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

// Get all admit cards with filters, search, and pagination
export const getAllAdmitCards = catchAsyncErrors(async (req, res, next) => {

    const { searchKeyword, page = 1, limit = 8 } = req.query;
    const query = {};
    if(searchKeyword){
        query.$or = [
            {title : {$regex : searchKeyword, $options: "i"}},
            {description : {$regex : searchKeyword, $options: "i"}},
            {organization : {$regex : searchKeyword, $options: "i"}},

        ]
    }
    const skip = (page - 1) * limit;
    const totalAdmitCards = await AdmitCard.countDocuments(query);
    const admitCards = await AdmitCard.find(query)
    .sort({createdAt : -1})
    .skip(skip)
    .limit(parseInt(limit));

    res.status(200).json({
        success : true,
        admitCards,
        currentPage : parseInt(page),
        totalPages  : Math.ceil(totalAdmitCards/limit),
        totalAdmitCards,

    })


});

// Get single admit card
export const getSingleAdmitCard = catchAsyncErrors(async (req, res, next) => {
    const admitCard = await AdmitCard.findById(req.params.id);
    
    if (!admitCard) {
        return next(new ErrorHandler("AdmitCard not found", 404));
    }

    res.status(200).json({
        success: true,
        admitCard
    });
});

// Get latest admit cards
export const getLatestAdmitCards = catchAsyncErrors(async (req, res, next) => {
  const admitCards = await AdmitCard.find()
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    admitCards
  });
});

// Create new admit card
export const createAdmitCard = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        description,
        exam_date,
        registration_start_date,
        registration_end_date,
        eligibility_criteria,
        download_link,
        organization
    } = req.body;

    if (!title || !description || !exam_date || !registration_start_date || 
        !registration_end_date || !eligibility_criteria || !download_link || !organization) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
    }

    const admitCard = await AdmitCard.create({
        title,
        description,
        exam_date,
        registration_start_date,
        registration_end_date,
        eligibility_criteria,
        download_link,
        organization
    });

    res.status(201).json({
        success: true,
        message: "Admit Card created successfully",
        admitCard
    });
});

// Update admit card
export const updateAdmitCard = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    const admitCard = await AdmitCard.findById(id);
    if (!admitCard) {
        return next(new ErrorHandler("Admit Card not found", 404));
    }

    const updatedAdmitCard = await AdmitCard.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        admitCard: updatedAdmitCard,
        message: "Admit Card updated successfully"
    });
});

// Delete admit card
export const deleteAdmitCard = catchAsyncErrors(async (req, res) => {
    const admitCard = await AdmitCard.findById(req.params.id);

    if (!admitCard) {
        return res.status(404).json({
            success: false,
            message: "Admit card not found"
        });
    }

    await admitCard.deleteOne();

    res.status(200).json({
        success: true,
        message: "Admit card deleted successfully"
    });
});