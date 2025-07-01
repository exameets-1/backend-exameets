import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { PreviousYear } from '../models/previousYearSchema.js';

// Get All Unique Subjects for /pyqs Page
export const getAllSubjects = catchAsyncErrors(async (req, res, next) => {
    const subjects = await PreviousYear.distinct("subject");

    if (!subjects.length) {
        return next(new ErrorHandler("No subjects found", 404));
    }

    res.status(200).json({
        success: true,
        subjects
    });
});

// Get All Papers of a Subject Grouped by Year for /pyqs/:subjectSlug
export const getPapersBySubject = catchAsyncErrors(async (req, res, next) => {
    const { subjectSlug } = req.params;
    const decodedSubject = decodeURIComponent(subjectSlug);

    const papers = await PreviousYear.find({ subject: decodedSubject }).sort({ year: -1 });

    if (!papers.length) {
        return next(new ErrorHandler(`No papers found for this subject :${subjectSlug}`, 404));
    }

    // Group papers by year
    const papersByYear = papers.reduce((acc, paper) => {
        if (!acc[paper.year]) {
            acc[paper.year] = [];
        }
        acc[paper.year].push(paper);
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        subject: decodedSubject,
        papersByYear
    });
});

// Get Papers of a Subject for a Specific Year for /pyqs/:subjectSlug/:year
export const getPapersBySubjectAndYear = catchAsyncErrors(async (req, res, next) => {
    const { subjectSlug, year } = req.params;
    const decodedSubject = decodeURIComponent(subjectSlug);

    const papers = await PreviousYear.find({ subject: decodedSubject, year: parseInt(year) });

    if (!papers.length) {
        return next(new ErrorHandler("No papers found for this subject and year", 404));
    }

    res.status(200).json({
        success: true,
        subject: decodedSubject,
        year: parseInt(year),
        papers
    });
});

// Get Latest Papers
export const getLatestPapers = catchAsyncErrors(async (req, res, next) => {
    const papers = await PreviousYear.find().sort({ createdAt: -1 }).limit(5); // Fetch the latest 5 papers

    if (!papers.length) {
        return next(new ErrorHandler("No papers found", 404));
    }

    res.status(200).json({
        success: true,
        papers, // Return the latest papers
    });
});

// Add a New Paper (Admin Only)
export const addPaper = catchAsyncErrors(async (req, res, next) => {
    const { title, subject, year, paper_link, solution_link, difficulty_level, exam_name, category, slug, is_featured, keywords , description, searchDescription } = req.body;

    if (!title || !subject || !year || !paper_link) {
        return next(new ErrorHandler("Title, subject, year, and paper link are required", 400));
    }

    const paper = await PreviousYear.create({
        title,
        subject,
        year,
        paper_link,
        solution_link,
        difficulty_level,
        exam_name,
        category,
        slug,
        is_featured,
        keywords,
        description,
        searchDescription,
        createdAt: new Date(),
        postedBy : req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Paper added successfully",
        paper,
    });
});

// Delete a Paper (Admin Only)
export const deletePaper = catchAsyncErrors(async (req, res, next) => {
    const { paperId } = req.params;

    const paper = await PreviousYear.findById(paperId);

    if (!paper) {
        return next(new ErrorHandler("Paper not found", 404));
    }

    // Use deleteOne instead of remove
    await PreviousYear.deleteOne({ _id: paperId });

    res.status(200).json({
        success: true,
        message: "Paper deleted successfully",
    });
});

// Update a Paper (Admin Only)
export const updatePaper = catchAsyncErrors(async (req, res, next) => {
    const { paperId } = req.params;
    const updates = req.body;

    const paper = await PreviousYear.findById(paperId);

    if (!paper) {
        return next(new ErrorHandler("Paper not found", 404));
    }

    Object.keys(updates).forEach((key) => {
        paper[key] = updates[key];
    });

    await paper.save();

    res.status(200).json({
        success: true,
        message: "Paper updated successfully",
        paper,
    });
});

import fetch from 'node-fetch';

// export const processPreviousYearPaperDetails = async (req, res) => {
//   try {
//     const { paperDetails } = req.body;

//     if (!paperDetails) {
//       return res.status(400).json({ success: false, message: 'Paper details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create a previous year paper JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(PreviousYear.schema.obj, null, 2)}

//       Paper Details:
//       ${paperDetails}

//       Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
//       Make sure to generate a unique slug by combining the paper title, subject with today's date. Make sure the slug is URL-friendly.
//       Ensure the JSON is valid and well-structured. Make sure the paper details are professional as the website is in production
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
//           { role: 'system', content: 'You are a helpful assistant that generates structured previous year paper posting data in JSON format.' },
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
//     let paperData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       paperData = JSON.parse(jsonString.trim());
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
//     if (!paperData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       paperData.slug = `${paperData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the paper in the database
//     const paper = new PreviousYear(paperData);
//     await paper.save();

//     res.status(201).json({
//       success: true,
//       message: 'Paper processed and saved successfully',
//       paper
//     });
//   } catch (error) {
//     console.error('Error in paper processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save paper',
//       error: error.message
//     });
//   }
// };

export const processPreviousYearPaperDetails = async (req, res) => {
  try {
    const { paperDetails } = req.body;
    const user = req.user._id;

    if (!paperDetails) {
      return res.status(400).json({ success: false, message: 'Paper details are required' });
    }

    // Step 1: Initial AI generation
    const initialPrompt = `
      Create a previous year paper JSON based on the following details. Follow this exact schema:
      ${JSON.stringify(PreviousYear.schema.obj, null, 2)}

      Paper Details:
      ${paperDetails}

      Generate a complete JSON without any placeholder values. Use empty strings for missing information.
      Make sure to generate a unique slug by combining the paper title, exam name, subject with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
      
      IMPORTANT: Ensure all nested objects and arrays are properly structured:
      - keywords: array of strings
      - is_featured: boolean (true/false)
      - year: must be a number (not string)
      - difficulty_level: must be one of ["Easy", "Medium", "Hard", "Very Hard"]
      - category: must be one of ["Engineering", "Medical", "Civil Services", "Banking", "Railways", "Teaching", "Defence", "State Services", "Other"]
      - All string fields should be strings, not arrays
      - Generate meaningful keywords based on the paper content
      - Create a comprehensive searchDescription for SEO
    `;

    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial previous year paper JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial paper data', 
        error: initialResponse.error 
      });
    }

    // Step 2: Validation and correction
    const validationPrompt = `
      You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

      SCHEMA REQUIREMENTS:
      - keywords: Must be array of strings
      - is_featured: Must be boolean (true/false)
      - year: Must be a number (not string)
      - difficulty_level: Must be one of ["Easy", "Medium", "Hard", "Very Hard"] - if invalid, default to "Medium"
      - category: Must be one of ["Engineering", "Medical", "Civil Services", "Banking", "Railways", "Teaching", "Defence", "State Services", "Other"] - if invalid, default to "Other"
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Remove any fields not in the schema
      - Ensure slug is URL-friendly (lowercase, hyphens, no spaces)
      - Generate meaningful keywords if missing
      - Create searchDescription if missing

      JSON TO VALIDATE AND FIX:
      ${JSON.stringify(initialResponse.data, null, 2)}

      Return ONLY the corrected JSON. Fix all validation errors, ensure proper data types, correct enum values, and proper array structures.
    `;

    const validationResponse = await callOpenRouterAI(validationPrompt, 'Validate and correct JSON');
    
    if (!validationResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to validate paper data', 
        error: validationResponse.error 
      });
    }

    let paperData = validationResponse.data;

    // Step 3: Final safety checks and manual corrections
    paperData = applySafetyChecksForPreviousYearPaper(paperData);

    // Step 4: Create and save the paper
    const paper = new PreviousYear(paperData);
    paper.postedBy = user;
    paper.createdAt = new Date();
    
    // Validate before saving
    try {
      await paper.validate();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Paper data validation failed',
        errors: validationError.errors
      });
    }

    await paper.save();

    res.status(201).json({
      success: true,
      message: 'Paper processed and saved successfully',
      paper: paper
    });

  } catch (error) {
    console.error('Error in paper processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save paper',
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
            content: `You are a precise JSON generator for previous year paper postings. Always return valid JSON without explanations. Context: ${context}` 
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

// Apply final safety checks and corrections for previous year papers
function applySafetyChecksForPreviousYearPaper(paperData) {
  // Ensure is_featured is boolean
  if (typeof paperData.is_featured !== 'boolean') {
    paperData.is_featured = false;
  }

  // Ensure year is a number
  if (paperData.year && typeof paperData.year !== 'number') {
    const yearNum = parseInt(paperData.year);
    if (!isNaN(yearNum) && yearNum > 1900 && yearNum <= new Date().getFullYear()) {
      paperData.year = yearNum;
    } else {
      paperData.year = new Date().getFullYear();
    }
  }

  // Validate difficulty_level enum
  const validDifficultyLevels = ["Easy", "Medium", "Hard", "Very Hard"];
  if (!validDifficultyLevels.includes(paperData.difficulty_level)) {
    paperData.difficulty_level = "Medium"; // Default value
  }

  // Validate category enum
  const validCategories = [
    "Engineering", "Medical", "Civil Services", "Banking", "Railways", 
    "Teaching", "Defence", "State Services", "Other"
  ];
  if (!validCategories.includes(paperData.category)) {
    paperData.category = "Other"; // Default value
  }

  // Handle keywords array
  if (!Array.isArray(paperData.keywords)) {
    if (typeof paperData.keywords === 'string') {
      paperData.keywords = paperData.keywords.split(',').map(item => item.trim()).filter(item => item);
    } else {
      paperData.keywords = [];
    }
  } else {
    // Ensure all items in array are strings
    paperData.keywords = paperData.keywords.map(item => String(item)).filter(item => item.trim() !== '');
  }

  // Ensure slug is URL-friendly
  if (paperData.slug) {
    paperData.slug = paperData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate slug if missing
  if (!paperData.slug && paperData.title) {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    let slugParts = [paperData.title];
    
    if (paperData.exam_name) slugParts.push(paperData.exam_name);
    if (paperData.subject) slugParts.push(paperData.subject);
    if (paperData.year) slugParts.push(paperData.year.toString());
    
    const baseSlug = slugParts.join(' ').toLowerCase().replace(/\s+/g, '-');
    paperData.slug = `${baseSlug}-${formattedDate}`;
  }

  // Ensure all string fields are strings
  const stringFields = [
    'title', 'exam_name', 'description', 'subject', 'paper_link',
    'solution_link', 'slug', 'searchDescription'
  ];
  
  stringFields.forEach(field => {
    if (paperData[field] && typeof paperData[field] !== 'string') {
      if (Array.isArray(paperData[field])) {
        paperData[field] = paperData[field].join(' ');
      } else {
        paperData[field] = String(paperData[field]);
      }
    }
    if (!paperData[field]) {
      paperData[field] = '';
    }
  });

  // Generate searchDescription if missing
  if (!paperData.searchDescription || paperData.searchDescription.trim() === '') {
    const title = paperData.title || 'Previous Year Paper';
    const examName = paperData.exam_name || '';
    const subject = paperData.subject || '';
    const year = paperData.year || '';
    const category = paperData.category || '';
    
    let searchDesc = `${title}`;
    if (examName) searchDesc += ` for ${examName}`;
    if (subject) searchDesc += ` - ${subject}`;
    if (year) searchDesc += ` (${year})`;
    if (category && category !== 'Other') searchDesc += ` in ${category}`;
    searchDesc += '. Download previous year question papers with solutions for exam preparation.';
    
    paperData.searchDescription = searchDesc;
  }

  // Generate keywords if missing or empty
  if (!Array.isArray(paperData.keywords) || paperData.keywords.length === 0) {
    const keywordSources = [
      paperData.title,
      paperData.exam_name,
      paperData.subject,
      paperData.category,
      paperData.year?.toString(),
      'previous year paper',
      'question paper',
      'exam preparation'
    ].filter(Boolean);

    paperData.keywords = [...new Set(keywordSources.map(k => k.toLowerCase()))].slice(0, 12);
  }

  // Remove any undefined or null values
  Object.keys(paperData).forEach(key => {
    if (paperData[key] === undefined || paperData[key] === null) {
      if (key === 'keywords') {
        paperData[key] = [];
      } else if (key === 'is_featured') {
        paperData[key] = false;
      } else if (key === 'year') {
        paperData[key] = new Date().getFullYear();
      } else if (key === 'difficulty_level') {
        paperData[key] = 'Medium';
      } else if (key === 'category') {
        paperData[key] = 'Other';
      } else {
        paperData[key] = '';
      }
    }
  });

  // Clean up slug to ensure uniqueness potential
  if (paperData.slug) {
    // Add timestamp to make it more unique
    const timestamp = Date.now().toString().slice(-6);
    if (!paperData.slug.includes(timestamp)) {
      paperData.slug += `-${timestamp}`;
    }
  }

  // Validate URL formats for links
  const urlFields = ['paper_link', 'solution_link'];
  urlFields.forEach(field => {
    if (paperData[field] && paperData[field].trim() !== '') {
      // Basic URL validation - add protocol if missing
      if (!paperData[field].startsWith('http://') && !paperData[field].startsWith('https://')) {
        paperData[field] = 'https://' + paperData[field];
      }
    }
  });

  return paperData;
}