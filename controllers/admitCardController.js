// admitCardController.js
import { AdmitCard } from "../models/admitCardSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

// Get all admit cards with filters, search, and pagination
export const getAllAdmitCards = catchAsyncErrors(async (req, res, next) => {
  const { searchKeyword, page = 1, limit = 8 } = req.query;
  const query = {};
  
  if(searchKeyword){
    query.$or = [
      { title: { $regex: searchKeyword, $options: "i" } },
      { organization: { $regex: searchKeyword, $options: "i" } },
      { advertisementNumber: { $regex: searchKeyword, $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;
  const totalAdmitCards = await AdmitCard.countDocuments(query);
  
  const admitCards = await AdmitCard.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    admitCards,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalAdmitCards/limit),
    totalAdmitCards,
  });
});

// Get single admit card
export const getSingleAdmitCard = catchAsyncErrors(async (req, res, next) => {
  const admitCard = await AdmitCard.findById(req.params.id);
  
  if (!admitCard) {
    return next(new ErrorHandler("Admit Card not found", 404));
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
  const requiredFields = [
    'title',
    'organization',
    'slug',
  ];

  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return next(new ErrorHandler(
      `Missing required fields: ${missingFields.join(', ')}`, 
      400
    ));
  }

  // Validate importantDates structure
  if (!Array.isArray(req.body.importantDates)) {
    return next(new ErrorHandler(
      "Important dates must be an array of objects with event and date",
      400
    ));
  }

  for (const detail of req.body.examDetails) {
    if (!detail.examDate || !detail.shiftTimings || !detail.reportingTime) {
      return next(new ErrorHandler(
        "Each exam detail must contain examDate, shiftTimings and reportingTime",
        400
      ));
    }
  }

  const admitCard = await AdmitCard.create({
    ...req.body,
    keywords: req.body.keywords || [],
    searchDescription: req.body.searchDescription || req.body.description.substring(0, 150),
    createdAt: new Date(),
    postedBy : req.user._id
  });

  res.status(201).json({
    success: true,
    message: "Admit Card created successfully",
    admitCard
  });
});

// Update admit card
export const updateAdmitCard = catchAsyncErrors(async (req, res, next) => {
  const updates = req.body;
  const admitCard = await AdmitCard.findById(req.params.id);

  if (!admitCard) {
    return next(new ErrorHandler("Admit Card not found", 404));
  }

  const updatedAdmitCard = await AdmitCard.findByIdAndUpdate(
    req.params.id,
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
export const deleteAdmitCard = catchAsyncErrors(async (req, res, next) => {
  const admitCard = await AdmitCard.findById(req.params.id);

  if (!admitCard) {
    return next(new ErrorHandler("Admit Card not found", 404));
  }

  await admitCard.deleteOne();

  res.status(200).json({
    success: true,
    message: "Admit card deleted successfully"
  });
});