import { Result } from "../models/resultSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllResults = catchAsyncErrors(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        let query = {};

        if (req.query.keyword) {
            query.$or = [
                { title: { $regex: req.query.keyword, $options: 'i' } },
                { organization: { $regex: req.query.keyword, $options: 'i' } },
                { postName: { $regex: req.query.keyword, $options: 'i' } }
            ];
        }

        const totalResults = await Result.countDocuments(query);
        const results = await Result.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalResults / limit);
        res.status(200).json({
            success: true,
            results,
            currentPage: page,
            totalPages,
            totalResults,
            message: "Results fetched successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getASingleResult = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const result = await Result.findById(id);

    if (!result) {
        return next(new ErrorHandler("Result not found", 404));
    }

    res.status(200).json({
        success: true,
        result
    });
});

export const getLatestResults = catchAsyncErrors(async (req, res, next) => {
    const results = await Result.find()
        .sort({ _id: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        results
    });
});

export const deleteResult = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const result = await Result.findById(id);

    if (!result) {
        return next(new ErrorHandler("Result not found", 404));
    }

    await result.deleteOne();

    res.status(200).json({
        success: true,
        message: "Result deleted successfully"
    });
});

export const updateResult = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const result = await Result.findById(id);

    if (!result) {
        return next(new ErrorHandler("Result not found", 404));
    }

    const updatedResult = await Result.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        result: updatedResult,
        message: "Result updated successfully"
    });
});

export const createResult = catchAsyncErrors(async (req, res, next) => {
    try {
        const { totalVacancies } = req.body;

        if (!totalVacancies) {
            return next(new ErrorHandler("Total Vacancies is a required field", 400));
        }

        const newResult = await Result.create({
            ...req.body,
            keywords: req.body.keywords || [],
            searchDescription: req.body.searchDescription || req.body.description.substring(0, 150),
            createdAt: new Date(),
            postedBy : req.user._id
        });

        res.status(201).json({
            success: true,
            result: newResult,
            message: "Result created successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

import fetch from 'node-fetch';

// export const processResultDetails = async (req, res) => {
//   try {
//     const { resultDetails } = req.body;

//     if (!resultDetails) {
//       return res.status(400).json({ success: false, message: 'Result details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create a result JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(Result.schema.obj, null, 2)}

//       Result Details:
//       ${resultDetails}

//       Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
//       Make sure to generate a unique slug by combining the result title, exam name with today's date. Make sure the slug is URL-friendly.
//       Ensure the JSON is valid and well-structured. Make sure the result details are professional as the website is in production
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
//           { role: 'system', content: 'You are a helpful assistant that generates structured result posting data in JSON format.' },
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
//     let resultData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       resultData = JSON.parse(jsonString.trim());
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
//     if (!resultData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       resultData.slug = `${resultData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the result in the database
//     const result = new Result(resultData);
//     await result.save();

//     res.status(201).json({
//       success: true,
//       message: 'Result processed and saved successfully',
//       result
//     });
//   } catch (error) {
//     console.error('Error in result processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save result',
//       error: error.message
//     });
//   }
// };

export const processResultDetails = async (req, res) => {
  try {
    const { resultDetails } = req.body;
    const user = req.user._id;

    if (!resultDetails) {
      return res.status(400).json({ success: false, message: 'Result details are required' });
    }

    // Step 1: Initial AI generation
    const initialPrompt = `
      Create a result posting JSON based on the following details. Follow this exact schema:
      ${JSON.stringify(Result.schema.obj, null, 2)}

      Result Details:
      ${resultDetails}

      Generate a complete JSON without any placeholder values. Use empty strings for missing information.
      Make sure to generate a unique slug by combining the result title, organization name with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
      
      IMPORTANT: Ensure all nested objects and arrays are properly structured:
      - nextSteps: array of strings
      - stepsToCheckResult: array of strings
      - documentsRequired: array of strings
      - keywords: array of strings
      - importantDates: array of objects with 'event' and 'date' fields
      - cutoffMarks: array of objects with 'category' and 'marks' fields
      - importantLinks: object with specific link fields (resultLink, meritListLink, cutoffLink, nextStepsLink, aboutJobLink)
      - isFeatured: boolean (true/false)
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Generate meaningful keywords based on the result content
      - Create a comprehensive searchDescription for SEO
    `;

    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial result JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial result data', 
        error: initialResponse.error 
      });
    }

    // Step 2: Validation and correction
    const validationPrompt = `
      You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

      SCHEMA REQUIREMENTS:
      - nextSteps: Must be array of strings
      - stepsToCheckResult: Must be array of strings
      - documentsRequired: Must be array of strings
      - keywords: Must be array of strings
      - importantDates: Must be array of objects with 'event' (string) and 'date' (string) fields
      - cutoffMarks: Must be array of objects with 'category' (string) and 'marks' (string) fields
      - importantLinks: Must be object with fields: resultLink, meritListLink, cutoffLink, nextStepsLink, aboutJobLink (all strings)
      - isFeatured: Must be boolean (true/false)
      - totalVacancies: Required field, must be string
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
        message: 'Failed to validate result data', 
        error: validationResponse.error 
      });
    }

    let resultData = validationResponse.data;

    // Step 3: Final safety checks and manual corrections
    resultData = applySafetyChecksForResult(resultData);

    // Step 4: Create and save the result
    const result = new Result(resultData);
    result.postedBy = user;
    result.createdAt = new Date();
    
    // Validate before saving
    try {
      await result.validate();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Result data validation failed',
        errors: validationError.errors
      });
    }

    await result.save();

    res.status(201).json({
      success: true,
      message: 'Result processed and saved successfully',
      result: result
    });

  } catch (error) {
    console.error('Error in result processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save result',
      error: error.message
    });
  }
};

// Helper function to call OpenRouter AI (reuse the same function)
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
            content: `You are a precise JSON generator for exam result postings. Always return valid JSON without explanations. Context: ${context}` 
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

// Apply final safety checks and corrections for results
function applySafetyChecksForResult(resultData) {
  // Ensure isFeatured is boolean
  if (typeof resultData.isFeatured !== 'boolean') {
    resultData.isFeatured = false;
  }

  // Define all array fields that should be arrays of strings
  const stringArrayFields = [
    'nextSteps', 'stepsToCheckResult', 'documentsRequired', 'keywords'
  ];

  // Handle string array fields
  stringArrayFields.forEach(field => {
    if (!Array.isArray(resultData[field])) {
      if (typeof resultData[field] === 'string') {
        // Split by newlines or commas and clean up
        if (field === 'keywords') {
          resultData[field] = resultData[field].split(',').map(item => item.trim()).filter(item => item);
        } else {
          resultData[field] = resultData[field].split('\n').map(item => item.trim()).filter(item => item);
        }
      } else {
        resultData[field] = [];
      }
    } else {
      // Ensure all items in array are strings
      resultData[field] = resultData[field].map(item => String(item)).filter(item => item.trim() !== '');
    }
  });

  // Handle importantDates array (special case - array of objects)
  if (!Array.isArray(resultData.importantDates)) {
    resultData.importantDates = [];
  } else {
    resultData.importantDates = resultData.importantDates.map(item => {
      if (typeof item === 'string') {
        return { event: item, date: '' };
      }
      return {
        event: item.event || '',
        date: item.date || ''
      };
    }).filter(item => item.event.trim() !== '');
  }

  // Handle cutoffMarks array (special case - array of objects)
  if (!Array.isArray(resultData.cutoffMarks)) {
    resultData.cutoffMarks = [];
  } else {
    resultData.cutoffMarks = resultData.cutoffMarks.map(item => {
      if (typeof item === 'string') {
        return { category: item, marks: '' };
      }
      return {
        category: item.category || '',
        marks: item.marks || ''
      };
    }).filter(item => item.category.trim() !== '');
  }

  // Handle importantLinks object
  if (!resultData.importantLinks || typeof resultData.importantLinks !== 'object') {
    resultData.importantLinks = {};
  }
  
  // Ensure all importantLinks fields are strings
  const linkFields = ['resultLink', 'meritListLink', 'cutoffLink', 'nextStepsLink', 'aboutJobLink'];
  linkFields.forEach(field => {
    if (!resultData.importantLinks[field] || typeof resultData.importantLinks[field] !== 'string') {
      resultData.importantLinks[field] = '';
    }
  });

  // Ensure slug is URL-friendly
  if (resultData.slug) {
    resultData.slug = resultData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate slug if missing
  if (!resultData.slug && resultData.title) {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const organizationSlug = resultData.organization ? resultData.organization.toLowerCase().replace(/\s+/g, '-') : 'result';
    resultData.slug = `${resultData.title.toLowerCase().replace(/\s+/g, '-')}-${organizationSlug}-${formattedDate}`;
  }

  // Ensure all string fields are strings
  const stringFields = [
    'title', 'organization', 'postName', 'totalVacancies', 'exam_type',
    'resultDate', 'officialWebsite', 'nextStepsDescription', 'slug',
    'searchDescription'
  ];
  
  stringFields.forEach(field => {
    if (resultData[field] && typeof resultData[field] !== 'string') {
      if (Array.isArray(resultData[field])) {
        resultData[field] = resultData[field].join(' ');
      } else {
        resultData[field] = String(resultData[field]);
      }
    }
    if (!resultData[field]) {
      resultData[field] = '';
    }
  });

  // Ensure totalVacancies is not empty (required field)
  if (!resultData.totalVacancies || resultData.totalVacancies.trim() === '') {
    resultData.totalVacancies = 'Not specified';
  }

  // Set default exam_type if missing
  if (!resultData.exam_type || resultData.exam_type.trim() === '') {
    resultData.exam_type = 'Written Exam';
  }

  // Generate searchDescription if missing
  if (!resultData.searchDescription || resultData.searchDescription.trim() === '') {
    const title = resultData.title || 'Result';
    const organization = resultData.organization || '';
    const postName = resultData.postName || '';
    const examType = resultData.exam_type || '';
    
    let searchDesc = `${title} result`;
    if (organization) searchDesc += ` for ${organization}`;
    if (postName) searchDesc += ` ${postName}`;
    if (examType) searchDesc += ` (${examType})`;
    searchDesc += '. Check your result, cutoff marks, merit list, and next steps.';
    
    resultData.searchDescription = searchDesc;
  }

  // Generate keywords if missing or empty
  if (!Array.isArray(resultData.keywords) || resultData.keywords.length === 0) {
    const keywordSources = [
      resultData.title,
      resultData.organization,
      resultData.postName,
      resultData.exam_type
    ].filter(Boolean);
    
    const allKeywords = [...keywordSources, 'result', 'exam', 'cutoff', 'merit list', 'marks'];
    
    resultData.keywords = [...new Set(allKeywords.map(k => k.toLowerCase()))].slice(0, 10);
  }

  // Remove any undefined or null values
  Object.keys(resultData).forEach(key => {
    if (resultData[key] === undefined || resultData[key] === null) {
      if (stringArrayFields.includes(key) || key === 'importantDates' || key === 'cutoffMarks') {
        resultData[key] = [];
      } else if (key === 'importantLinks') {
        resultData[key] = {
          resultLink: '',
          meritListLink: '',
          cutoffLink: '',
          nextStepsLink: '',
          aboutJobLink: ''
        };
      } else if (key === 'isFeatured') {
        resultData[key] = false;
      } else {
        resultData[key] = '';
      }
    }
  });

  // Clean up slug to ensure uniqueness potential
  if (resultData.slug) {
    // Add timestamp to make it more unique
    const timestamp = Date.now().toString().slice(-6);
    if (!resultData.slug.includes(timestamp)) {
      resultData.slug += `-${timestamp}`;
    }
  }

  return resultData;
}