import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Internship } from "../models/internshipSchema.js";


export const getAllInternships = catchAsyncErrors(async(req, res, next) => {
    const { 
        searchKeyword, 
        city, 
        internship_type, 
        page = 1, 
        limit = 8,
    } = req.query;

    const query = {};
    
    // Location filter with exact and nearby matches
    if (city && city !== "All") {
        query.location = { 
            $regex: city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            $options: "i" 
        };
    }
    
    // Internship type filter
    if (internship_type && internship_type !== "All") {
        query.internship_type = { 
            $regex: internship_type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            $options: "i" 
        };
    }

    //  Enhanced search functionality
    if (searchKeyword) {
        const searchRegex = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
            { title: { $regex: searchRegex, $options: "i" } },
            { organization: { $regex: searchRegex, $options: "i" } },
            { location: { $regex: searchRegex, $options: "i" } },
            { description: { $regex: searchRegex, $options: "i" } },
            { skills_required: { $regex: searchRegex, $options: "i" } },
            { field: { $regex: searchRegex, $options: "i" } },
            { qualification: { $regex: searchRegex, $options: "i" } },
            { internship_type: { $regex: searchRegex, $options: "i" } },
            { searchDescription: { $regex: searchRegex, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;
    const totalInternships = await Internship.countDocuments(query);

    const internships = await Internship.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        internships,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalInternships / limit),
        totalInternships,
    });
});

export const getASingleInternship = catchAsyncErrors(async(req, res, next) => {
    const { id } = req.params;
    const internship = await Internship.findById(id);

    if (!internship) {
        return next(new ErrorHandler("Internship not found", 404));
    }
    res.status(200).json({
        success: true,
        internship
    });
});

export const createInternship = catchAsyncErrors(async(req, res, next) => {
    const requiredFields = [
        'slug', 'title'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        return next(new ErrorHandler(
            `Missing required fields: ${missingFields.join(', ')}`,
            400
        ));
    }

    const internship = await Internship.create({
        ...req.body,
        keywords: req.body.keywords || [],
        searchDescription: req.body.searchDescription || req.body.description.substring(0, 150),
        createdAt: new Date(),
        postedBy : req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Internship created successfully",
        internship
    });
});

export const getLatestInternships = catchAsyncErrors(async (req, res, next) => {
    const internships = await Internship.find()
        .sort({ createdAt: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        internships
    });
});

export const deleteInternship = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const internship = await Internship.findById(id);

    if (!internship) {
        return next(new ErrorHandler("Internship not found", 404));
    }

    await internship.deleteOne();

    res.status(200).json({
        success: true,
        message: "Internship deleted successfully"
    });
});

export const updateInternship = catchAsyncErrors(async (req, res, next) => {
    const internshipId = req.params.id;
    const { removedFields, ...updates } = req.body;

    // console.log('Received removedFields:', removedFields);
    // console.log('Update data keys:', Object.keys(updates));

    const internship = await Internship.findById(internshipId);
    if (!internship) {
        return next(new ErrorHandler('Internship not found', 404));
    }

    // Prepare fields to unset (completely remove from document)
    const fieldsToUnset = {};
    const fieldsToRemove = new Set(); // Track which fields should be removed
    
    if (removedFields && Array.isArray(removedFields)) {
        removedFields.forEach(field => {
            // console.log('Preparing to unset field:', field);
            
            switch (field) {
                // Direct field removal - individual internship fields
                case 'imageUrl':
                case 'start_date':
                case 'duration':
                case 'stipend':
                case 'location':
                case 'qualification':
                case 'application_link':
                case 'last_date':
                case 'field':
                case 'description':
                case 'slug':
                case 'searchDescription':
                case 'skills_required':
                case 'eligibility_criteria':
                case 'keywords':
                    fieldsToUnset[field] = "";
                    fieldsToRemove.add(field); // Track this field as being removed
                    // console.log(`Will unset ${field}`);
                    break;
                
                // Featured option
                case 'is_featured':
                    fieldsToUnset.is_featured = "";
                    fieldsToRemove.add('is_featured');
                    console.log('Will unset is_featured');
                    break;
                    
                default:
                    // Handle direct field removal for any other fields
                    if (internship.schema.paths[field]) {
                        fieldsToUnset[field] = "";
                        fieldsToRemove.add(field);
                        console.log(`Will unset ${field}`);
                    }
                    break;
            }
        });
    }

    // Create update operations
    const updateOperations = {};
    
    // Add fields to update (set operation) - EXCLUDE fields that are being removed
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null && key !== 'removedFields') {
            // Only include this field in updates if it's NOT being removed
            if (!fieldsToRemove.has(key)) {
                filteredUpdates[key] = updates[key];
            }
        }
    });

    if (Object.keys(filteredUpdates).length > 0) {
        updateOperations.$set = filteredUpdates;
    }
    
    // Add fields to unset (remove completely)
    if (Object.keys(fieldsToUnset).length > 0) {
        updateOperations.$unset = fieldsToUnset;
        // console.log('Fields to unset:', fieldsToUnset);
    }

    // console.log('Final update operations:', JSON.stringify(updateOperations, null, 2));

    // Perform the update operation
    const updatedInternship = await Internship.findByIdAndUpdate(
        internshipId,
        updateOperations,
        { 
            new: true, // Return updated document
            runValidators: false // Disable validators since we might be removing required fields
        }
    );

    if (!updatedInternship) {
        return next(new ErrorHandler('Failed to update internship', 500));
    }

    // console.log('Internship updated successfully. Removed fields no longer exist in document.');

    res.status(200).json({
        success: true,
        message: "Internship updated successfully",
        internship: updatedInternship
    });
});

import fetch from 'node-fetch';

// export const processInternshipDetails = async (req, res) => {
//   try {
//     const { internshipDetails } = req.body;

//     if (!internshipDetails) {
//       return res.status(400).json({ success: false, message: 'Internship details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create a internship posting JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(Internship.schema.obj, null, 2)}

//       Internship Details:
//       ${internshipDetails}

//       Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
//       Make sure to generate a unique slug by combining the internship title, company name with today's date. Make sure the slug is URL-friendly.
//       Ensure the JSON is valid and well-structured. Make sure the internship details are professional as the website is in production
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
//           { role: 'system', content: 'You are a helpful assistant that generates structured internship posting data in JSON format.' },
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
//     let internshipData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       internshipData = JSON.parse(jsonString.trim());
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
//     if (!internshipData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       internshipData.slug = `${internshipData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the internship in the database
//     const internship = new Internship(internshipData);
//     await internship.save();

//     res.status(201).json({
//       success: true,
//       message: 'Internship processed and saved successfully',
//       internship
//     });
//   } catch (error) {
//     console.error('Error in internship processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save internship',
//       error: error.message
//     });
//   }
// };

export const processInternshipDetails = async (req, res) => {
  try {
    const { internshipDetails } = req.body;
    const user = req.user._id;

    if (!internshipDetails) {
      return res.status(400).json({ success: false, message: 'Internship details are required' });
    }

    // Step 1: Initial AI generation
    const initialPrompt = `
      Create an internship posting JSON based on the following details. Follow this exact schema:
      ${JSON.stringify(Internship.schema.obj, null, 2)}

      Internship Details:
      ${internshipDetails}

      Generate a complete JSON without any placeholder values. Use empty strings for missing information.
      Make sure to generate a unique slug by combining the internship title, organization name with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
      
      IMPORTANT: Ensure all nested objects and arrays are properly structured:
      - skills_required: array of strings
      - eligibility_criteria: array of strings
      - keywords: array of strings
      - is_featured: boolean (true/false)
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Generate meaningful keywords based on the internship content
      - Create a comprehensive searchDescription for SEO
    `;

    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial internship JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial internship data', 
        error: initialResponse.error 
      });
    }

    // Step 2: Validation and correction
    const validationPrompt = `
      You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

      SCHEMA REQUIREMENTS:
      - skills_required: Must be array of strings
      - eligibility_criteria: Must be array of strings
      - keywords: Must be array of strings
      - is_featured: Must be boolean (true/false)
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Remove any fields not in the schema
      - Ensure slug is URL-friendly (lowercase, hyphens, no spaces)
      - description field is required and must be a non-empty string
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
        message: 'Failed to validate internship data', 
        error: validationResponse.error 
      });
    }

    let internshipData = validationResponse.data;

    // Step 3: Final safety checks and manual corrections
    internshipData = applySafetyChecksForInternship(internshipData);

    // Step 4: Create and save the internship
    const internship = new Internship(internshipData);
    internship.postedBy = user;
    internship.createdAt = new Date();
    
    // Validate before saving
    try {
      await internship.validate();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Internship data validation failed',
        errors: validationError.errors
      });
    }

    await internship.save();

    res.status(201).json({
      success: true,
      message: 'Internship processed and saved successfully',
      internship: internship
    });

  } catch (error) {
    console.error('Error in internship processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save internship',
      error: error.message
    });
  }
};

// Helper function to call OpenRouter AI (reuse the same function from govt job)
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
            content: `You are a precise JSON generator for internship postings. Always return valid JSON without explanations. Context: ${context}` 
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

// Apply final safety checks and corrections for internships
function applySafetyChecksForInternship(internshipData) {
  // Ensure is_featured is boolean
  if (typeof internshipData.is_featured !== 'boolean') {
    internshipData.is_featured = false;
  }

  // Define all array fields that should be arrays of strings
  const stringArrayFields = [
    'skills_required', 'eligibility_criteria', 'keywords'
  ];

  // Handle string array fields
  stringArrayFields.forEach(field => {
    if (!Array.isArray(internshipData[field])) {
      if (typeof internshipData[field] === 'string') {
        // Split by newlines or commas and clean up
        if (field === 'keywords') {
          internshipData[field] = internshipData[field].split(',').map(item => item.trim()).filter(item => item);
        } else {
          internshipData[field] = internshipData[field].split('\n').map(item => item.trim()).filter(item => item);
        }
      } else {
        internshipData[field] = [];
      }
    } else {
      // Ensure all items in array are strings
      internshipData[field] = internshipData[field].map(item => String(item)).filter(item => item.trim() !== '');
    }
  });

  // Ensure slug is URL-friendly
  if (internshipData.slug) {
    internshipData.slug = internshipData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate slug if missing
  if (!internshipData.slug && internshipData.title) {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const organizationSlug = internshipData.organization ? internshipData.organization.toLowerCase().replace(/\s+/g, '-') : 'internship';
    internshipData.slug = `${internshipData.title.toLowerCase().replace(/\s+/g, '-')}-${organizationSlug}-${formattedDate}`;
  }

  // Ensure all string fields are strings
  const stringFields = [
    'internship_type', 'title', 'start_date', 'duration', 'stipend',
    'organization', 'location', 'qualification', 'application_link',
    'last_date', 'field', 'description', 'slug', 'searchDescription'
  ];
  
  stringFields.forEach(field => {
    if (internshipData[field] && typeof internshipData[field] !== 'string') {
      if (Array.isArray(internshipData[field])) {
        internshipData[field] = internshipData[field].join(' ');
      } else {
        internshipData[field] = String(internshipData[field]);
      }
    }
    if (!internshipData[field]) {
      internshipData[field] = '';
    }
  });

  // Ensure description is not empty (required field)
  if (!internshipData.description || internshipData.description.trim() === '') {
    // Generate a basic description if missing
    const title = internshipData.title || 'Internship';
    const organization = internshipData.organization || 'Organization';
    const duration = internshipData.duration || 'Duration not specified';
    internshipData.description = `${title} internship opportunity at ${organization}. Duration: ${duration}. Apply now for this exciting opportunity to gain valuable experience and skills.`;
  }

  // Generate searchDescription if missing
  if (!internshipData.searchDescription || internshipData.searchDescription.trim() === '') {
    const title = internshipData.title || 'Internship';
    const organization = internshipData.organization || '';
    const location = internshipData.location || '';
    const skills = Array.isArray(internshipData.skills_required) ? internshipData.skills_required.join(', ') : '';
    
    let searchDesc = `${title} internship`;
    if (organization) searchDesc += ` at ${organization}`;
    if (location) searchDesc += ` in ${location}`;
    if (skills) searchDesc += `. Required skills: ${skills}`;
    searchDesc += '. Apply now for this internship opportunity.';
    
    internshipData.searchDescription = searchDesc;
  }

  // Generate keywords if missing or empty
  if (!Array.isArray(internshipData.keywords) || internshipData.keywords.length === 0) {
    const keywordSources = [
      internshipData.title,
      internshipData.organization,
      internshipData.field,
      internshipData.internship_type,
      internshipData.location
    ].filter(Boolean);

    const skillsKeywords = Array.isArray(internshipData.skills_required) ? internshipData.skills_required : [];
    
    const allKeywords = [...keywordSources, ...skillsKeywords, 'internship', 'opportunity', 'student'];
    
    internshipData.keywords = [...new Set(allKeywords.map(k => k.toLowerCase()))].slice(0, 10);
  }

  // Remove any undefined or null values
  Object.keys(internshipData).forEach(key => {
    if (internshipData[key] === undefined || internshipData[key] === null) {
      if (stringArrayFields.includes(key)) {
        internshipData[key] = [];
      } else if (key === 'is_featured') {
        internshipData[key] = false;
      } else {
        internshipData[key] = '';
      }
    }
  });

  // Clean up slug to ensure uniqueness potential
  if (internshipData.slug) {
    // Add timestamp to make it more unique
    const timestamp = Date.now().toString().slice(-6);
    if (!internshipData.slug.includes(timestamp)) {
      internshipData.slug += `-${timestamp}`;
    }
  }

  return internshipData;
}