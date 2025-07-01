import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { Admission } from '../models/admissionSchema.js';
import fetch from 'node-fetch';

export const getAllAdmissions = catchAsyncErrors(async (req, res, next) => {
    const { 
        searchKeyword, 
        category, 
        location,
        page = 1, 
        limit = 8,
    } = req.query;

    try {
        // Build query
        const query = {};

        // Search functionality
        if (searchKeyword) {
            const searchRegex = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { title: { $regex: searchRegex, $options: "i" } },
                { description: { $regex: searchRegex, $options: "i" } },
                { institute: { $regex: searchRegex, $options: "i" } },
                { course: { $regex: searchRegex, $options: "i" } },
                { location: { $regex: searchRegex, $options: "i" } },
                { category: { $regex: searchRegex, $options: "i" } },
                { eligibility_criteria: { $regex: searchRegex, $options: "i" } }
            ];
        }

        // Category filter
        if (category && category !== "All") {
            query.category = { $regex: category, $options: "i" };
        }

        // Location filter
        if (location && location !== "All") {
            query.location = { $regex: location, $options: "i" };
        }

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Limit between 1 and 50
        const skip = (pageNum - 1) * limitNum;

        // Count total matching documents
        const totalAdmissions = await Admission.countDocuments(query);
        const totalPages = Math.ceil(totalAdmissions / limitNum);

        // Fetch admissions with sorting and pagination
        const admissions = await Admission.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .select('-__v')
            // Exclude version key

        // Get unique categories for filtering
        const categories = await Admission.distinct('category');

        // Calculate pagination metadata
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        const nextPage = hasNextPage ? pageNum + 1 : null;
        const prevPage = hasPrevPage ? pageNum - 1 : null;

        res.status(200).json({
            success: true,
            admissions,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalAdmissions,
                hasNextPage,
                hasPrevPage,
                nextPage,
                prevPage,
                limit: limitNum
            }
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getSingleAdmission = catchAsyncErrors(async (req, res, next) => {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
        return next(new ErrorHandler("Admission not found", 404));
    }

    res.status(200).json({
        success: true,
        admission
    });
});

export const getLatestAdmissions = catchAsyncErrors(async (req, res, next) => {
    const admissions = await Admission.find()
      .sort({ _id: -1 })
      .limit(5);
  
    res.status(200).json({
      success: true,
      admissions
    });
  });
  
  export const deleteAdmission = catchAsyncErrors(async (req, res, next) => {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
        return next(new ErrorHandler("Admission not found", 404));
    }

    await admission.deleteOne();

    res.status(200).json({
        success: true,
        message: "Admission deleted successfully"
    });
});

export const createAdmission = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        institute,
        description,
        eligibility_criteria,
        course,
        application_link,
        start_date,
        last_date,
        category,
        fees,
        location,
        is_featured,
        keywords,
        searchDescription,
        slug,
    } = req.body;

    const admission = await Admission.create({
        title,
        institute,
        description,
        eligibility_criteria,
        course,
        application_link,
        start_date,
        last_date,
        category,
        fees,
        location,
        is_featured,
        keywords,
        searchDescription,
        slug,
        createdAt: new Date(),
        postedBy: req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Admission created successfully",
        admission
    });
});

export const updateAdmission = catchAsyncErrors(async (req, res, next) => {
    let admission = await Admission.findById(req.params.id);

    if (!admission) {
        return next(new ErrorHandler("Admission not found", 404));
    }
    admission = await Admission.findByIdAndUpdate(req.params.id, 
        { 
            ...req.body.updatedData,
            lastUpdated: Date.now()
        }, 
        {
            new: true,
            runValidators: true
        }
    );
    res.status(200).json({
        success: true,
        admission
    });
});


// export const processAdmissionDetails = async (req, res) => {
//   try {
//     const { admissionDetails } = req.body;

//     if (!admissionDetails) {
//       return res.status(400).json({ success: false, message: 'Admission details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create a admission posting JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(Admission.schema.obj, null, 2)}

//       Admission Details:
//       ${admissionDetails}

//       Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
//       Make sure to generate a unique slug by combining the admission title, institute name with today's date. Make sure the slug is URL-friendly.
//       Ensure the JSON is valid and well-structured. Make sure the admission details are professional as the website is in production
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
//           { role: 'system', content: 'You are a helpful assistant that generates structured admission posting data in JSON format.' },
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
//     let admissionData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       admissionData = JSON.parse(jsonString.trim());
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
//     if (!admissionData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       admissionData.slug = `${admissionData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the admission in the database
//     const admission = new Admission(admissionData);
//     await admission.save();

//     res.status(201).json({
//       success: true,
//       message: 'Admission processed and saved successfully',
//       admission
//     });
//   } catch (error) {
//     console.error('Error in admission processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save admission',
//       error: error.message
//     });
//   }
// };

export const processAdmissionDetails = async (req, res) => {
  try {
    const { admissionDetails } = req.body;
    const user = req.user._id;

    if (!admissionDetails) {
      return res.status(400).json({ success: false, message: 'Admission details are required' });
    }

    // Step 1: Initial AI generation
    const initialPrompt = `
      Create an admission posting JSON based on the following details. Follow this exact schema:
      ${JSON.stringify(Admission.schema.obj, null, 2)}

      Admission Details:
      ${admissionDetails}

      Generate a complete JSON without any placeholder values. Use empty strings for missing information.
      Make sure to generate a unique slug by combining the admission title, institute name with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
    `;

    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial admission posting JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial admission data', 
        error: initialResponse.error 
      });
    }

    // Step 2: Validation and correction
    const validationPrompt = `
      You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

      SCHEMA REQUIREMENTS:
      - category: Must be exactly one of: 'Engineering', 'Medical', 'Arts', 'Science', 'Commerce', 'Management', 'Law', 'Design', 'Other'
      - keywords: Must be an array of strings
      - All string fields should be strings, not arrays
      - All array fields should be arrays, not strings
      - Remove any fields not in the schema
      - Ensure slug is URL-friendly (lowercase, hyphens, no spaces)
      - is_featured should be boolean (true/false)

      JSON TO VALIDATE AND FIX:
      ${JSON.stringify(initialResponse.data, null, 2)}

      Return ONLY the corrected JSON. Fix all validation errors, ensure proper data types, and make sure all enum values are exact matches. If category is missing or invalid, choose the most appropriate one from the allowed values.
    `;

    const validationResponse = await callOpenRouterAI(validationPrompt, 'Validate and correct JSON');
    
    if (!validationResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to validate admission data', 
        error: validationResponse.error 
      });
    }

    let admissionData = validationResponse.data;

    // Step 3: Final safety checks and manual corrections
    admissionData = applySafetyChecks(admissionData);

    // Step 4: Create and save the admission
    const admission = new Admission(admissionData);
    admission.postedBy = user;
    admission.createdAt = new Date();
    
    // Validate before saving
    try {
      await admission.validate();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Admission data validation failed',
        errors: validationError.errors
      });
    }

    await admission.save();

    res.status(201).json({
      success: true,
      message: 'Admission processed and saved successfully',
      admission
    });

  } catch (error) {
    console.error('Error in admission processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save admission',
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
            content: `You are a precise JSON generator for admission postings. Always return valid JSON without explanations. Context: ${context}` 
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
function applySafetyChecks(admissionData) {
  const validCategories = [
    'Engineering', 'Medical', 'Arts', 'Science', 'Commerce', 
    'Management', 'Law', 'Design', 'Other'
  ];
  
  // Ensure category has valid value
  if (!validCategories.includes(admissionData.category)) {
    admissionData.category = 'Other'; // Default fallback
  }

  // Ensure keywords is an array
  if (!Array.isArray(admissionData.keywords)) {
    if (typeof admissionData.keywords === 'string') {
      admissionData.keywords = admissionData.keywords.split(',').map(item => item.trim()).filter(item => item);
    } else {
      admissionData.keywords = [];
    }
  }

  // Ensure is_featured is boolean
  if (typeof admissionData.is_featured !== 'boolean') {
    admissionData.is_featured = false;
  }

  // Ensure slug is URL-friendly
  if (admissionData.slug) {
    admissionData.slug = admissionData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate slug if missing
  if (!admissionData.slug && admissionData.title) {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const instituteSlug = admissionData.institute ? admissionData.institute.toLowerCase().replace(/\s+/g, '-') : 'institute';
    admissionData.slug = `${admissionData.title.toLowerCase().replace(/\s+/g, '-')}-${instituteSlug}-${formattedDate}`;
  }

  // Ensure all string fields are strings (not arrays or objects)
  const stringFields = [
    'title', 'institute', 'description', 'eligibility_criteria', 
    'course', 'application_link', 'start_date', 'last_date', 
    'fees', 'location', 'searchDescription', 'slug'
  ];
  
  stringFields.forEach(field => {
    if (admissionData[field] && typeof admissionData[field] !== 'string') {
      if (Array.isArray(admissionData[field])) {
        admissionData[field] = admissionData[field].join(' ');
      } else {
        admissionData[field] = String(admissionData[field]);
      }
    }
    if (!admissionData[field]) {
      admissionData[field] = '';
    }
  });

  // Remove any undefined or null values
  Object.keys(admissionData).forEach(key => {
    if (admissionData[key] === undefined || admissionData[key] === null) {
      if (key === 'keywords') {
        admissionData[key] = [];
      } else if (key === 'is_featured') {
        admissionData[key] = false;
      } else {
        admissionData[key] = '';
      }
    }
  });

  return admissionData;
}