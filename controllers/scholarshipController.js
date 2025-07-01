import { Scholarship } from "../models/scholarshipSchema.js";
import ErrorHandler from "../middlewares/error.js";
import {catchAsyncErrors} from "../middlewares/catchAsyncErrors.js";

// Create new scholarship
export const createScholarship = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        organization,
        description,
        eligibility_criteria,
        amount,
        application_link,
        start_date,
        last_date,
        category,
        qualification,
        is_featured,
        keywords,
        searchDescription,
        slug,
    } = req.body;

    const scholarship = await Scholarship.create({
        title,
        organization,
        description,
        eligibility_criteria,
        amount,
        application_link,
        start_date,
        last_date,
        category,
        qualification,
        is_featured,
        keywords,
        searchDescription,
        slug,
        createdAt: new Date(),
        postedBy : req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Scholarship created successfully",
        scholarship
    });
});

// Get all scholarships with pagination and search
export const getAllScholarships = catchAsyncErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    const searchKeyword = req.query.searchKeyword || "";
    const category = req.query.category || "All";
    const qualification = req.query.qualification || "All";

    const searchQuery = {};

    // Add search keyword filter
    if (searchKeyword) {
        searchQuery.$or = [
            { title: { $regex: searchKeyword, $options: "i" } },
            { description: { $regex: searchKeyword, $options: "i" } },
            { organization: { $regex: searchKeyword, $options: "i" } },
            { qualification: { $regex: searchKeyword, $options: "i" } },
            { category: { $regex: searchKeyword, $options: "i" } },
        ];
    }

    // Add category filter
    if (category !== "All") {
        searchQuery.category = category;
    }

    // Add qualification filter
    if (qualification !== "All") {
        searchQuery.qualification = qualification;
    }

    const totalScholarships = await Scholarship.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalScholarships / limit);

    const scholarships = await Scholarship.find(searchQuery)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        scholarships,
        currentPage: page,
        totalPages,
        totalScholarships,
    });
});

// Get single scholarship
export const getASingleScholarship = catchAsyncErrors(async (req, res, next) => {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
        return next(new ErrorHandler("Scholarship not found", 404));
    }

    res.status(200).json({
        success: true,
        scholarship
    });
});

// Get latest scholarships
export const getLatestScholarships = catchAsyncErrors(async (req, res, next) => {
  const scholarships = await Scholarship.find()
    .sort({ _id: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    scholarships
  });
});

// Update scholarship
export const updateScholarship = catchAsyncErrors(async (req, res, next) => {
    let scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
        return next(new ErrorHandler("Scholarship not found", 404));
    }

    scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        scholarship
    });
});

// Delete scholarship
export const deleteScholarship = catchAsyncErrors(async (req, res, next) => {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
        return next(new ErrorHandler("Scholarship not found", 404));
    }

    await scholarship.deleteOne();

    res.status(200).json({
        success: true,
        message: "Scholarship deleted successfully"
    });
});

import fetch from 'node-fetch';

// export const processScholarshipDetails = async (req, res) => {
//   try {
//     const { scholarshipDetails } = req.body;

//     if (!scholarshipDetails) {
//       return res.status(400).json({ success: false, message: 'Scholarship details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create a scholarship posting JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(Scholarship.schema.obj, null, 2)}

//       Scholarship Details:
//       ${scholarshipDetails}

//       Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
//       Make sure to generate a unique slug by combining the scholarship title, organization name with today's date. Make sure the slug is URL-friendly.
//       Ensure the JSON is valid and well-structured. Make sure the scholarship details are professional as the website is in production
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
//           { role: 'system', content: 'You are a helpful assistant that generates structured scholarship posting data in JSON format.' },
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
//     let scholarshipData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       scholarshipData = JSON.parse(jsonString.trim());
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
//     if (!scholarshipData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       scholarshipData.slug = `${scholarshipData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the scholarship in the database
//     const scholarship = new Scholarship(scholarshipData);
//     await scholarship.save();

//     res.status(201).json({
//       success: true,
//       message: 'Scholarship processed and saved successfully',
//       scholarship
//     });
//   } catch (error) {
//     console.error('Error in scholarship processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save scholarship',
//       error: error.message
//     });
//   }
// };

export const processScholarshipDetails = async (req, res) => {
  try {
    const { scholarshipDetails } = req.body;
    const user = req.user._id;

    if (!scholarshipDetails) {
      return res.status(400).json({ success: false, message: 'Scholarship details are required' });
    }

    // Step 1: Initial AI generation
    const initialPrompt = `
      Create a scholarship posting JSON based on the following details. Follow this exact schema:
      ${JSON.stringify(Scholarship.schema.obj, null, 2)}

      Scholarship Details:
      ${scholarshipDetails}

      Generate a complete JSON without any placeholder values. Use empty strings for missing information.
      Make sure to generate a unique slug by combining the scholarship title, organization name with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
      
      IMPORTANT: Ensure all nested objects and arrays are properly structured:
      - keywords: array of strings
      - is_featured: boolean (true/false)
      - category: must be one of the enum values (Merit-based, Need-based, Research, Sports, Cultural, International, Government, Private, Other)
      - qualification: must be one of the enum values (Class 8, Class 9, Class 10, Class 11, Class 12, Graduation, Post Graduation, Post Graduation Diploma, Phd, ITI, Polytechnic/Diploma, Post Doctoral, Vocational Course, Coaching classes, Other)
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Generate meaningful keywords based on the scholarship content
      - Create a comprehensive searchDescription for SEO
    `;

    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial scholarship JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial scholarship data', 
        error: initialResponse.error 
      });
    }

    // Step 2: Validation and correction
    const validationPrompt = `
      You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

      SCHEMA REQUIREMENTS:
      - keywords: Must be array of strings
      - is_featured: Must be boolean (true/false)
      - category: Must be one of: Merit-based, Need-based, Research, Sports, Cultural, International, Government, Private, Other
      - qualification: Must be one of: Class 8, Class 9, Class 10, Class 11, Class 12, Graduation, Post Graduation, Post Graduation Diploma, Phd, ITI, Polytechnic/Diploma, Post Doctoral, Vocational Course, Coaching classes, Other
      - slug: Required field, must be URL-friendly (lowercase, hyphens, no spaces)
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Remove any fields not in the schema
      - Generate meaningful keywords if missing
      - Create searchDescription if missing

      JSON TO VALIDATE AND FIX:
      ${JSON.stringify(initialResponse.data, null, 2)}

      Return ONLY the corrected JSON. Fix all validation errors, ensure proper data types, and correct array structures. If any required nested objects are malformed, restructure them properly.
    `;

    const validationResponse = await callOpenRouterAI(validationPrompt, 'Validate and correct JSON');
    
    if (!validationResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to validate scholarship data', 
        error: validationResponse.error 
      });
    }

    let scholarshipData = validationResponse.data;

    // Step 3: Final safety checks and manual corrections
    scholarshipData = applySafetyChecksForScholarship(scholarshipData);

    // Step 4: Create and save the scholarship
    const scholarship = new Scholarship(scholarshipData);
    scholarship.postedBy = user;
    scholarship.createdAt = new Date();
    
    // Validate before saving
    try {
      await scholarship.validate();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Scholarship data validation failed',
        errors: validationError.errors
      });
    }

    await scholarship.save();

    res.status(201).json({
      success: true,
      message: 'Scholarship processed and saved successfully',
      scholarship: scholarship
    });

  } catch (error) {
    console.error('Error in scholarship processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save scholarship',
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
            content: `You are a precise JSON generator for scholarship postings. Always return valid JSON without explanations. Context: ${context}` 
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

// Apply final safety checks and corrections for scholarships
function applySafetyChecksForScholarship(scholarshipData) {
  // Ensure is_featured is boolean
  if (typeof scholarshipData.is_featured !== 'boolean') {
    scholarshipData.is_featured = false;
  }

  // Handle keywords array
  if (!Array.isArray(scholarshipData.keywords)) {
    if (typeof scholarshipData.keywords === 'string') {
      // Split by commas and clean up
      scholarshipData.keywords = scholarshipData.keywords.split(',').map(item => item.trim()).filter(item => item);
    } else {
      scholarshipData.keywords = [];
    }
  } else {
    // Ensure all items in array are strings
    scholarshipData.keywords = scholarshipData.keywords.map(item => String(item)).filter(item => item.trim() !== '');
  }

  // Validate category enum
  const validCategories = [
    'Merit-based', 'Need-based', 'Research', 'Sports', 'Cultural', 
    'International', 'Government', 'Private', 'Other'
  ];
  if (!validCategories.includes(scholarshipData.category)) {
    scholarshipData.category = 'Other';
  }

  // Validate qualification enum
  const validQualifications = [
    'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'Graduation', 'Post Graduation', 'Post Graduation Diploma', 'Phd',
    'ITI', 'Polytechnic/Diploma', 'Post Doctoral', 'Vocational Course',
    'Coaching classes', 'Other'
  ];
  if (!validQualifications.includes(scholarshipData.qualification)) {
    scholarshipData.qualification = 'Other';
  }

  // Ensure slug is URL-friendly
  if (scholarshipData.slug) {
    scholarshipData.slug = scholarshipData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate slug if missing
  if (!scholarshipData.slug && scholarshipData.title) {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const organizationSlug = scholarshipData.organization ? scholarshipData.organization.toLowerCase().replace(/\s+/g, '-') : 'scholarship';
    scholarshipData.slug = `${scholarshipData.title.toLowerCase().replace(/\s+/g, '-')}-${organizationSlug}-${formattedDate}`;
  }

  // Ensure all string fields are strings
  const stringFields = [
    'title', 'organization', 'description', 'eligibility_criteria', 'amount',
    'application_link', 'start_date', 'last_date', 'searchDescription', 'slug'
  ];
  
  stringFields.forEach(field => {
    if (scholarshipData[field] && typeof scholarshipData[field] !== 'string') {
      if (Array.isArray(scholarshipData[field])) {
        scholarshipData[field] = scholarshipData[field].join(' ');
      } else {
        scholarshipData[field] = String(scholarshipData[field]);
      }
    }
    if (!scholarshipData[field]) {
      scholarshipData[field] = '';
    }
  });

  // Generate searchDescription if missing
  if (!scholarshipData.searchDescription || scholarshipData.searchDescription.trim() === '') {
    const title = scholarshipData.title || 'Scholarship';
    const organization = scholarshipData.organization || '';
    const category = scholarshipData.category || '';
    const qualification = scholarshipData.qualification || '';
    const amount = scholarshipData.amount || '';
    
    let searchDesc = `${title} scholarship`;
    if (organization) searchDesc += ` by ${organization}`;
    if (category) searchDesc += ` (${category})`;
    if (qualification) searchDesc += ` for ${qualification}`;
    if (amount) searchDesc += ` worth ${amount}`;
    searchDesc += '. Apply now for this scholarship opportunity.';
    
    scholarshipData.searchDescription = searchDesc;
  }

  // Generate keywords if missing or empty
  if (!Array.isArray(scholarshipData.keywords) || scholarshipData.keywords.length === 0) {
    const keywordSources = [
      scholarshipData.title,
      scholarshipData.organization,
      scholarshipData.category,
      scholarshipData.qualification
    ].filter(Boolean);
    
    const allKeywords = [...keywordSources, 'scholarship', 'education', 'funding', 'financial aid'];
    
    scholarshipData.keywords = [...new Set(allKeywords.map(k => k.toLowerCase()))].slice(0, 10);
  }

  // Remove any undefined or null values
  Object.keys(scholarshipData).forEach(key => {
    if (scholarshipData[key] === undefined || scholarshipData[key] === null) {
      if (key === 'keywords') {
        scholarshipData[key] = [];
      } else if (key === 'is_featured') {
        scholarshipData[key] = false;
      } else {
        scholarshipData[key] = '';
      }
    }
  });

  // Clean up slug to ensure uniqueness potential
  if (scholarshipData.slug) {
    // Add timestamp to make it more unique
    const timestamp = Date.now().toString().slice(-6);
    if (!scholarshipData.slug.includes(timestamp)) {
      scholarshipData.slug += `-${timestamp}`;
    }
  }

  // Validate and clean URLs
  if (scholarshipData.application_link && !scholarshipData.application_link.startsWith('http')) {
    if (scholarshipData.application_link.trim() !== '') {
      scholarshipData.application_link = `https://${scholarshipData.application_link}`;
    }
  }

  return scholarshipData;
}