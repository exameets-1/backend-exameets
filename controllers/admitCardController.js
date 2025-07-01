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

import fetch from 'node-fetch';

// export const processAdmitCardDetails = async (req, res) => {
//   try {
//     const { admitCardDetails } = req.body;

//     if (!admitCardDetails) {
//       return res.status(400).json({ success: false, message: 'Admit card details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create an admit card JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(AdmitCard.schema.obj, null, 2)}

//       Admit Card Details:
//       ${admitCardDetails}

//       Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
//       Make sure to generate a unique slug by combining the admit card title, organization name with today's date. Make sure the slug is URL-friendly.
//       Ensure the JSON is valid and well-structured. Make sure the admit card details are professional as the website is in production
//       Do not include any explanations, just return valid JSON. Exclude createdAt and updatedAt fields from the JSON.
//     `;

//     // Call OpenRouter AI API
//     const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
//         'X-Title': 'Job Portal'
//       },
//       body: JSON.stringify({
//         model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo', // Use default model if not specified
//         messages: [
//           { role: 'system', content: 'You are a helpful assistant that generates structured admit card data in JSON format.' },
//           { role: 'user', content: prompt }
//         ]
//       })
//     });

//     if (!openRouterResponse.ok) {
//       const errorData = await openRouterResponse.json();
//       console.error('OpenRouter API error:', errorData);
//       return res.status(500).json({ success: false, message: 'Failed to process with AI', error: errorData });
//     }

//     const aiResponse = await openRouterResponse.json();
    
//     // Extract the generated JSON from the AI response
//     let admitCardData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       admitCardData = JSON.parse(jsonString.trim());
//     } catch (error) {
//       console.error('Error parsing AI response:', error);
//       return res.status(500).json({ 
//         success: false, 
//         message: 'Failed to parse AI response', 
//         aiResponse,
//         error: error.message 
//       });
//     }
    
//     // Generate a slug if it's missing
//     if (!admitCardData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       admitCardData.slug = `${admitCardData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the admit card in the database
//     const admitCard = new AdmitCard(admitCardData);
//     await admitCard.save();

//     res.status(201).json({
//       success: true,
//       message: 'Admit card processed and saved successfully',
//       admitCard
//     });
//   } catch (error) {
//     console.error('Error in admit card processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save admit card',
//       error: error.message
//     });
//   }
// };

export const processAdmitCardDetails = async (req, res) => {
  try {
    const { admitCardDetails } = req.body;
    const user = req.user._id;

    if (!admitCardDetails) {
      return res.status(400).json({ success: false, message: 'Admit card details are required' });
    }

    // Step 1: Initial AI generation
    const initialPrompt = `
      Create an admit card JSON based on the following details. Follow this exact schema:
      ${JSON.stringify(AdmitCard.schema.obj, null, 2)}

      Admit Card Details:
      ${admitCardDetails}

      Generate a complete JSON without any placeholder values. Use empty strings for missing information.
      Make sure to generate a unique slug by combining the admit card title, organization name with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
      
      IMPORTANT: Ensure all nested objects and arrays are properly structured:
      - importantDates: array of objects with 'event' and 'date' fields
      - examDetails: array of objects with 'examDate', 'shiftTimings', 'reportingTime' fields
      - downloadSteps: array of strings
      - importantLinks: array of objects with 'linkType' and 'link' fields
      - instructions: array of strings
      - keywords: array of strings
    `;

    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial admit card JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial admit card data', 
        error: initialResponse.error 
      });
    }

    // Step 2: Validation and correction
    const validationPrompt = `
      You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

      SCHEMA REQUIREMENTS:
      - importantDates: Must be array of objects with 'event' (string) and 'date' (string) fields
      - examDetails: Must be array of objects with 'examDate' (string), 'shiftTimings' (string), 'reportingTime' (string) fields
      - downloadSteps: Must be array of strings
      - importantLinks: Must be array of objects with 'linkType' (string) and 'link' (string) fields
      - instructions: Must be array of strings
      - keywords: Must be array of strings
      - isFeatured: Must be boolean (true/false)
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Remove any fields not in the schema
      - Ensure slug is URL-friendly (lowercase, hyphens, no spaces)

      JSON TO VALIDATE AND FIX:
      ${JSON.stringify(initialResponse.data, null, 2)}

      Return ONLY the corrected JSON. Fix all validation errors, ensure proper data types, and correct array structures. If any required nested objects are malformed, restructure them properly.
    `;

    const validationResponse = await callOpenRouterAI(validationPrompt, 'Validate and correct JSON');
    
    if (!validationResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to validate admit card data', 
        error: validationResponse.error 
      });
    }

    let admitCardData = validationResponse.data;

    // Step 3: Final safety checks and manual corrections
    admitCardData = applySafetyChecks(admitCardData);

    // Step 4: Create and save the admit card
    const admitCard = new AdmitCard(admitCardData);
    admitCard.postedBy = user;
    admitCard.createdAt = new Date();
    
    // Validate before saving
    try {
      await admitCard.validate();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Admit card data validation failed',
        errors: validationError.errors
      });
    }

    await admitCard.save();

    res.status(201).json({
      success: true,
      message: 'Admit card processed and saved successfully',
      admitCard
    });

  } catch (error) {
    console.error('Error in admit card processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save admit card',
      error: error.message
    });
  }
};

// Helper function to call OpenRouter AI
async function callOpenRouterAI(prompt, context) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Job Portal'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are a precise JSON generator for admit card postings. Always return valid JSON without explanations. Context: ${context}` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1 // Lower temperature for more consistent outputs
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData };
    }

    const aiResponse = await response.json();
    
    // Parse the JSON response
    const aiContent = aiResponse.choices[0].message.content;
    const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
    const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
    
    const parsedData = JSON.parse(jsonString.trim());
    
    return { success: true, data: parsedData };
    
  } catch (error) {
    console.error('AI API call error:', error);
    return { success: false, error: error.message };
  }
}

// Apply final safety checks and corrections
function applySafetyChecks(admitCardData) {
  // Ensure isFeatured is boolean
  if (typeof admitCardData.isFeatured !== 'boolean') {
    admitCardData.isFeatured = false;
  }

  // Handle importantDates array
  if (!Array.isArray(admitCardData.importantDates)) {
    admitCardData.importantDates = [];
  } else {
    admitCardData.importantDates = admitCardData.importantDates.map(item => {
      if (typeof item === 'string') {
        return { event: item, date: '' };
      }
      return {
        event: item.event || '',
        date: item.date || ''
      };
    });
  }

  // Handle examDetails array
  if (!Array.isArray(admitCardData.examDetails)) {
    admitCardData.examDetails = [];
  } else {
    admitCardData.examDetails = admitCardData.examDetails.map(item => {
      if (typeof item === 'string') {
        return { examDate: item, shiftTimings: '', reportingTime: '' };
      }
      return {
        examDate: item.examDate || '',
        shiftTimings: item.shiftTimings || '',
        reportingTime: item.reportingTime || ''
      };
    });
  }

  // Handle downloadSteps array
  if (!Array.isArray(admitCardData.downloadSteps)) {
    if (typeof admitCardData.downloadSteps === 'string') {
      admitCardData.downloadSteps = admitCardData.downloadSteps.split('\n').map(step => step.trim()).filter(step => step);
    } else {
      admitCardData.downloadSteps = [];
    }
  }

  // Handle importantLinks array
  if (!Array.isArray(admitCardData.importantLinks)) {
    admitCardData.importantLinks = [];
  } else {
    admitCardData.importantLinks = admitCardData.importantLinks.map(item => {
      if (typeof item === 'string') {
        return { linkType: 'Link', link: item };
      }
      return {
        linkType: item.linkType || 'Link',
        link: item.link || ''
      };
    });
  }

  // Handle instructions array
  if (!Array.isArray(admitCardData.instructions)) {
    if (typeof admitCardData.instructions === 'string') {
      admitCardData.instructions = admitCardData.instructions.split('\n').map(instruction => instruction.trim()).filter(instruction => instruction);
    } else {
      admitCardData.instructions = [];
    }
  }

  // Handle keywords array
  if (!Array.isArray(admitCardData.keywords)) {
    if (typeof admitCardData.keywords === 'string') {
      admitCardData.keywords = admitCardData.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
    } else {
      admitCardData.keywords = [];
    }
  }

  // Ensure slug is URL-friendly
  if (admitCardData.slug) {
    admitCardData.slug = admitCardData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate slug if missing
  if (!admitCardData.slug && admitCardData.title) {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const organizationSlug = admitCardData.organization ? admitCardData.organization.toLowerCase().replace(/\s+/g, '-') : 'organization';
    admitCardData.slug = `${admitCardData.title.toLowerCase().replace(/\s+/g, '-')}-${organizationSlug}-${formattedDate}`;
  }

  // Ensure all string fields are strings
  const stringFields = [
    'title', 'organization', 'advertisementNumber', 'vacancies', 
    'officialWebsite', 'searchDescription', 'slug'
  ];
  
  stringFields.forEach(field => {
    if (admitCardData[field] && typeof admitCardData[field] !== 'string') {
      if (Array.isArray(admitCardData[field])) {
        admitCardData[field] = admitCardData[field].join(' ');
      } else {
        admitCardData[field] = String(admitCardData[field]);
      }
    }
    if (!admitCardData[field]) {
      admitCardData[field] = '';
    }
  });

  // Remove any undefined or null values
  Object.keys(admitCardData).forEach(key => {
    if (admitCardData[key] === undefined || admitCardData[key] === null) {
      const arrayFields = ['importantDates', 'examDetails', 'downloadSteps', 'importantLinks', 'instructions', 'keywords'];
      if (arrayFields.includes(key)) {
        admitCardData[key] = [];
      } else if (key === 'isFeatured') {
        admitCardData[key] = false;
      } else {
        admitCardData[key] = '';
      }
    }
  });

  return admitCardData;
}