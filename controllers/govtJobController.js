import mongoose from "mongoose";
import { GovtJob } from "../models/govtJobSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";


export const getAllGovtJobs = catchAsyncErrors(async (req, res, next) => {
    const { location, sort, searchKeyword, page = 1, limit = 8 } = req.query;
    const query = {};

    // Location filter
    if (location && location !== "All") {
        query.jobLocation = { $regex: location, $options: "i" };
    }

    // Search logic
    if (searchKeyword) {
        query.$or = [
            { jobTitle: { $regex: searchKeyword, $options: "i" } },
            { organization: { $regex: searchKeyword, $options: "i" } },
            { jobLocation: { $regex: searchKeyword, $options: "i" } },
            { postNames: { $regex: searchKeyword } },
            { notification_about: { $regex: searchKeyword } },
            { jobOverview: { $regex: searchKeyword } }
        ];
    }

    // Sorting logic 
    let sortOptions = {};

    //By default sort by createdAt : -1
    sortOptions.createdAt = -1;

    if (sort === 'recent') {
        sortOptions.notificationReleaseDate = -1; // Recent first
    } else if (sort === 'deadline') {
        sortOptions.applicationEndDate = 1; // Nearest deadline first
    }

    const skip = (page - 1) * limit;
    const totalJobs = await GovtJob.countDocuments(query);

    const govtJobs = await GovtJob.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        govtJobs,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
    });
});

export const getASingleGovtJob = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const job = await GovtJob.findById(id);

    if (!job) {
        return next(new ErrorHandler("Job not found.", 404));
    }

    res.status(200).json({
        success: true,
        job,
    });
});

export const getLatestGovtJobs = catchAsyncErrors(async (req, res, next) => {
  const govtJobs = await GovtJob.find()
    .sort({ _id: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    govtJobs
  });
});

export const deleteGovtJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const job = await GovtJob.findById(id);
  
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }
  
  await job.deleteOne();
  
  res.status(200).json({
    success: true,
    message: "GovtJob deleted successfully."
  });
});

export const updateGovtJob = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    let updates = req.body;

    // Validate main job ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid job ID", 400));
    }

    // Validate FAQ data
    if (updates.faq) {
        if (!Array.isArray(updates.faq)) {
            return next(new ErrorHandler("FAQ must be an array", 400));
        }
        updates.faq = updates.faq.map(faq => {
            if (!faq.question || !faq.answer) {
                throw new ErrorHandler("Each FAQ must have both question and answer", 400);
            }
            return {
                ...faq,
                _id: mongoose.Types.ObjectId.isValid(faq._id) 
                    ? faq._id 
                    : new mongoose.Types.ObjectId()
            };
        });
    }

    try {
        const updatedJob = await GovtJob.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedJob) {
            return next(new ErrorHandler("Government Job not found", 404));
        }

        res.status(200).json({
            success: true,
            job: updatedJob
        });
    } catch (error) {
        console.error('Update error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors)
                .map(err => err.message)
                .join(', ');
            return next(new ErrorHandler(`Validation failed: ${validationErrors}`, 400));
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const key = Object.keys(error.keyValue)[0];
            return next(new ErrorHandler(`Duplicate value for ${key}`, 400));
        }

        // Handle other errors
        return next(new ErrorHandler(error.message || "Failed to update job", 500));
    }
});

export const createGovtJob = catchAsyncErrors(async (req, res, next) => {
  try {
      // Destructure all fields from request body according to schema
      const {
          jobTitle,
          slug,
          jobOverview,
          year,
          organization,
          postNames,
          totalVacancies,
          applicationMode,
          jobLocation,
          officialWebsite,
          notification_about,
          notificationReleaseDate,
          applicationStartDate,
          applicationEndDate,
          examInterviewDate,
          educationalQualifications,
          ageLimitMin,
          ageLimitMax,
          ageRelaxation,
          additionalRequirements,
          vacancyPostNames,
          vacancyCounts,
          vacancyPayScales,
          applicationFeeGeneral,
          applicationFee_SC_ST_PWD,
          applicationFeePaymentMode,
          selectionProcess,
          howToApplyOnlineSteps,
          howToApplyOfflineSteps,
          requiredDocuments,
          examSubjects,
          examQuestionCounts,
          examMarks,
          examDurations,
          notificationPDFLink,
          applyOnlineLink,
          officialWebsiteLink,
          keywords,
          searchDescription,
          isFeatured,
          faq,
      } = req.body;

      // Validate required fields based on schema
      const requiredFields = [
          'jobTitle',
          'slug',
          'organization',
          'notification_about',
          'applicationStartDate',
          'applicationEndDate',
          'totalVacancies'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
          return next(new ErrorHandler(`Missing required fields: ${missingFields.join(', ')}`, 400));
      }

      // Create the job with all fields
      const newGovtJob = await GovtJob.create({
          jobTitle,
          slug,
          jobOverview,
          year,
          organization,
          postNames,
          totalVacancies,
          applicationMode,
          jobLocation,
          officialWebsite,
          notification_about,
          notificationReleaseDate,
          applicationStartDate,
          applicationEndDate,
          examInterviewDate,
          educationalQualifications,
          ageLimitMin,
          ageLimitMax,
          ageRelaxation,
          additionalRequirements,
          vacancyPostNames,
          vacancyCounts,
          vacancyPayScales: vacancyPayScales,
          applicationFeeGeneral,
          applicationFee_SC_ST_PWD,
          applicationFeePaymentMode,
          selectionProcess,
          howToApplyOnlineSteps,
          howToApplyOfflineSteps,
          requiredDocuments,
          examSubjects,
          examQuestionCounts,
          examMarks,
          examDurations,
          notificationPDFLink,
          applyOnlineLink,
          officialWebsiteLink,
          keywords,
          searchDescription,
          isFeatured,
          faq,
          postedBy : req.user._id
      });

      res.status(201).json({
          success: true,
          govtJob: newGovtJob,
          message: "Government Job created successfully"
      });
  } catch (error) {
      return next(new ErrorHandler(error.message, 500));
  }
});

import fetch from 'node-fetch';

// export const processGovtJobDetails = async (req, res) => {
//   try {
//     const { govtJobDetails } = req.body;

//     if (!govtJobDetails) {
//       return res.status(400).json({ success: false, message: 'Govt Job details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create a job posting JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(GovtJob.schema.obj, null, 2)}

//       Job Details:
//       ${govtJobDetails}
//         Ensure the JSON includes all required fields and is structured correctly.
//       Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
//       Make sure to generate a unique slug by combining the job title, company name with today's date. Make sure the slug is URL-friendly.
//       Ensure the JSON is valid and well-structured. Make sure the job details are professional as the website is in production
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
//           { role: 'system', content: 'You are a helpful assistant that generates structured govt job posting data in JSON format.' },
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
//     let govtJobData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       govtJobData = JSON.parse(jsonString.trim());
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
//     if (!govtJobData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       govtJobData.slug = `${govtJobData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the job in the database
//     const job = new GovtJob(govtJobData);
//     await job.save();

//     res.status(201).json({
//       success: true,
//       message: 'Job processed and saved successfully',
//       job
//     });
//   } catch (error) {
//     console.error('Error in govt job processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save govt job',
//       error: error.message
//     });
//   }
// };

// export const processGovtJobDetails = async (req, res) => {
//   try {
//     const { govtJobDetails } = req.body;
//     const user = req.user._id;

//     if (!govtJobDetails) {
//       return res.status(400).json({ success: false, message: 'Govt Job details are required' });
//     }

//     // Step 1: Initial AI generation
//     const initialPrompt = `
//       Create a government job posting JSON based on the following details. Follow this exact schema:
//       ${JSON.stringify(GovtJob.schema.obj, null, 2)}

//       Government Job Details:
//       ${govtJobDetails}

//       Generate a complete JSON without any placeholder values. Use empty strings for missing information.
//       Make sure to generate a unique slug by combining the job title, organization name with today's date.
//       Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
//       Do not include createdAt, updatedAt, or postedBy fields.
//       Return only valid JSON without explanations.
      
//       IMPORTANT: Ensure all nested objects and arrays are properly structured:
//       - postNames: array of strings
//       - educationalQualifications: array of strings
//       - additionalRequirements: array of strings
//       - vacancyPostNames: array of strings
//       - vacancyCounts: array of strings
//       - vacancyPayScales: array of strings
//       - selectionProcess: array of strings
//       - howToApplyOnlineSteps: array of strings
//       - howToApplyOfflineSteps: array of strings
//       - requiredDocuments: array of strings
//       - examSubjects: array of strings
//       - examQuestionCounts: array of strings
//       - examMarks: array of strings
//       - examDurations: array of strings
//       - faq: array of objects with 'question' and 'answer' fields
//       - keywords: array of strings
//     `;

//     const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial govt job JSON');
    
//     if (!initialResponse.success) {
//       return res.status(500).json({ 
//         success: false, 
//         message: 'Failed to generate initial govt job data', 
//         error: initialResponse.error 
//       });
//     }

//     // Step 2: Validation and correction
//     const validationPrompt = `
//       You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

//       SCHEMA REQUIREMENTS:
//       - postNames: Must be array of strings
//       - educationalQualifications: Must be array of strings
//       - additionalRequirements: Must be array of strings
//       - vacancyPostNames: Must be array of strings
//       - vacancyCounts: Must be array of strings
//       - vacancyPayScales: Must be array of strings
//       - selectionProcess: Must be array of strings
//       - howToApplyOnlineSteps: Must be array of strings
//       - howToApplyOfflineSteps: Must be array of strings
//       - requiredDocuments: Must be array of strings
//       - examSubjects: Must be array of strings
//       - examQuestionCounts: Must be array of strings
//       - examMarks: Must be array of strings
//       - examDurations: Must be array of strings
//       - faq: Must be array of objects with 'question' (string) and 'answer' (string) fields
//       - keywords: Must be array of strings
//       - isFeatured: Must be boolean (true/false)
//       - All string fields should be strings, not arrays
//       - All array fields should be arrays with proper structure
//       - Remove any fields not in the schema
//       - Ensure slug is URL-friendly (lowercase, hyphens, no spaces)

//       JSON TO VALIDATE AND FIX:
//       ${JSON.stringify(initialResponse.data, null, 2)}

//       Return ONLY the corrected JSON. Fix all validation errors, ensure proper data types, and correct array structures. If any required nested objects are malformed, restructure them properly.
//     `;

//     const validationResponse = await callOpenRouterAI(validationPrompt, 'Validate and correct JSON');
    
//     if (!validationResponse.success) {
//       return res.status(500).json({ 
//         success: false, 
//         message: 'Failed to validate govt job data', 
//         error: validationResponse.error 
//       });
//     }

//     let govtJobData = validationResponse.data;

//     // Step 3: Final safety checks and manual corrections
//     govtJobData = applySafetyChecksForGovtJob(govtJobData);

//     // Step 4: Create and save the govt job
//     const govtJob = new GovtJob(govtJobData);
//     govtJob.postedBy = user;
//     govtJob.createdAt = new Date();
    
//     // Validate before saving
//     try {
//       await govtJob.validate();
//     } catch (validationError) {
//       console.error('Mongoose validation error:', validationError);
//       return res.status(400).json({
//         success: false,
//         message: 'Govt job data validation failed',
//         errors: validationError.errors
//       });
//     }

//     console.log('Final Govt Job Data:', govtJobData);
//     await govtJob.save();

//     res.status(201).json({
//       success: true,
//       message: 'Govt job processed and saved successfully',
//       job: govtJob
//     });

//   } catch (error) {
//     console.error('Error in govt job processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save govt job',
//       error: error.message
//     });
//   }
// };

// // Helper function to call OpenRouter AI (reuse the same function from admit card)
// async function callOpenRouterAI(prompt, context) {
//   try {
//     const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
//         'X-Title': 'Job Portal'
//       },
//       body: JSON.stringify({
//         model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
//         messages: [
//           { 
//             role: 'system', 
//             content: `You are a precise JSON generator for government job postings. Always return valid JSON without explanations. Context: ${context}` 
//           },
//           { role: 'user', content: prompt }
//         ],
//         temperature: 0.1 // Lower temperature for more consistent outputs
//       })
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       return { success: false, error: errorData };
//     }

//     const aiResponse = await response.json();
    
//     // Parse the JSON response
//     const aiContent = aiResponse.choices[0].message.content;
//     const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//     const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
    
//     const parsedData = JSON.parse(jsonString.trim());
    
//     return { success: true, data: parsedData };
    
//   } catch (error) {
//     console.error('AI API call error:', error);
//     return { success: false, error: error.message };
//   }
// }

// // Apply final safety checks and corrections for government jobs
// function applySafetyChecksForGovtJob(govtJobData) {
//   // Ensure isFeatured is boolean
//   if (typeof govtJobData.isFeatured !== 'boolean') {
//     govtJobData.isFeatured = false;
//   }

//   // Define all array fields that should be arrays of strings
//   const stringArrayFields = [
//     'postNames', 'educationalQualifications', 'additionalRequirements',
//     'vacancyPostNames', 'vacancyCounts', 'vacancyPayScales',
//     'selectionProcess', 'howToApplyOnlineSteps', 'howToApplyOfflineSteps',
//     'requiredDocuments', 'examSubjects', 'examQuestionCounts',
//     'examMarks', 'examDurations', 'keywords'
//   ];

//   // Handle string array fields
//   stringArrayFields.forEach(field => {
//     if (!Array.isArray(govtJobData[field])) {
//       if (typeof govtJobData[field] === 'string') {
//         // Split by newlines or commas and clean up
//         if (field === 'keywords') {
//           govtJobData[field] = govtJobData[field].split(',').map(item => item.trim()).filter(item => item);
//         } else {
//           govtJobData[field] = govtJobData[field].split('\n').map(item => item.trim()).filter(item => item);
//         }
//       } else {
//         govtJobData[field] = [];
//       }
//     } else {
//       // Ensure all items in array are strings
//       govtJobData[field] = govtJobData[field].map(item => String(item)).filter(item => item.trim() !== '');
//     }
//   });

//   // Handle FAQ array (special case - array of objects)
//   if (!Array.isArray(govtJobData.faq)) {
//     govtJobData.faq = [];
//   } else {
//     govtJobData.faq = govtJobData.faq.map(item => {
//       if (typeof item === 'string') {
//         return { question: item, answer: '' };
//       }
//       return {
//         question: item.question || '',
//         answer: item.answer || ''
//       };
//     }).filter(item => item.question.trim() !== '');
//   }

//   // Ensure slug is URL-friendly
//   if (govtJobData.slug) {
//     govtJobData.slug = govtJobData.slug.toLowerCase()
//       .replace(/[^a-z0-9\s-]/g, '')
//       .replace(/\s+/g, '-')
//       .replace(/-+/g, '-')
//       .trim();
//   }

//   // Generate slug if missing
//   if (!govtJobData.slug && govtJobData.jobTitle) {
//     const date = new Date();
//     const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//     const organizationSlug = govtJobData.organization ? govtJobData.organization.toLowerCase().replace(/\s+/g, '-') : 'organization';
//     govtJobData.slug = `${govtJobData.jobTitle.toLowerCase().replace(/\s+/g, '-')}-${organizationSlug}-${formattedDate}`;
//   }

//   // Ensure all string fields are strings
//   const stringFields = [
//     'jobTitle', 'jobOverview', 'year', 'organization', 'totalVacancies',
//     'applicationMode', 'jobLocation', 'officialWebsite', 'notification_about',
//     'notificationReleaseDate', 'applicationStartDate', 'applicationEndDate',
//     'examInterviewDate', 'ageLimitMin', 'ageLimitMax', 'ageRelaxation',
//     'applicationFeeGeneral', 'applicationFee_SC_ST_PWD', 'applicationFeePaymentMode',
//     'notificationPDFLink', 'applyOnlineLink', 'officialWebsiteLink',
//     'searchDescription', 'slug'
//   ];
  
//   stringFields.forEach(field => {
//     if (govtJobData[field] && typeof govtJobData[field] !== 'string') {
//       if (Array.isArray(govtJobData[field])) {
//         govtJobData[field] = govtJobData[field].join(' ');
//       } else {
//         govtJobData[field] = String(govtJobData[field]);
//       }
//     }
//     if (!govtJobData[field]) {
//       govtJobData[field] = '';
//     }
//   });

//   // Remove any undefined or null values
//   Object.keys(govtJobData).forEach(key => {
//     if (govtJobData[key] === undefined || govtJobData[key] === null) {
//       if (stringArrayFields.includes(key) || key === 'faq') {
//         govtJobData[key] = [];
//       } else if (key === 'isFeatured') {
//         govtJobData[key] = false;
//       } else {
//         govtJobData[key] = '';
//       }
//     }
//   });

//   return govtJobData;
// }

export const processGovtJobDetails = async (req, res) => {
  try {
    const { govtJobDetails } = req.body;
    const user = req.user._id;

    if (!govtJobDetails) {
      return res.status(400).json({ success: false, message: 'Govt Job details are required' });
    }

    // Step 1: Enhanced Initial AI generation with better prompting
    const initialPrompt = `
      Create a government job posting JSON based on the following details. Follow this exact schema and ensure ALL fields are populated with meaningful data:

      CRITICAL: Fill ALL basic information fields - do not leave jobTitle, organization, year, etc. empty!

      SCHEMA FIELDS TO POPULATE:
      - jobTitle: Extract the main job position name (REQUIRED - cannot be empty)
      - jobOverview: Create a brief description of the job (REQUIRED)
      - year: Current year (2025) or year mentioned in details (REQUIRED)
      - organization: Name of the hiring organization/department (REQUIRED)
      - totalVacancies: Total number of positions available (REQUIRED)
      - applicationMode: Online/Offline/Both (REQUIRED)
      - jobLocation: State/City where job is located (REQUIRED)
      - officialWebsite: Organization's official website
      - notification_about: Brief about what this notification is for

      IMPORTANT DATES (use format DD-MM-YYYY or estimate if not provided):
      - notificationReleaseDate: When notification was released
      - applicationStartDate: When applications begin
      - applicationEndDate: Last date to apply
      - examInterviewDate: Exam/interview date

      ELIGIBILITY (provide reasonable defaults if not specified):
      - ageLimitMin: Minimum age requirement (default: "18")
      - ageLimitMax: Maximum age requirement (default: "35")
      - ageRelaxation: Age relaxation details for reserved categories

      APPLICATION FEES (provide typical government job fees if not specified):
      - applicationFeeGeneral: Fee for general category (e.g., "500")
      - applicationFee_SC_ST_PWD: Fee for reserved categories (e.g., "250")
      - applicationFeePaymentMode: How to pay the fee (default: "Online")

      ARRAY FIELDS (ensure proper structure):
      - postNames: array of job position names
      - educationalQualifications: array of education requirements
      - additionalRequirements: array of additional criteria
      - vacancyPostNames: array of post names with vacancies
      - vacancyCounts: array of vacancy numbers as strings
      - vacancyPayScales: array of salary ranges
      - selectionProcess: array of selection steps
      - howToApplyOnlineSteps: array of online application steps
      - howToApplyOfflineSteps: array of offline application steps
      - requiredDocuments: array of required documents
      - examSubjects: array of exam subjects
      - examQuestionCounts: array of question numbers as strings
      - examMarks: array of marks as strings
      - examDurations: array of exam durations
      - faq: array of objects with 'question' and 'answer' fields
      - keywords: array of relevant keywords

      LINKS:
      - notificationPDFLink: Link to official notification PDF
      - applyOnlineLink: Direct application link
      - officialWebsiteLink: Main website link

      Government Job Details:
      ${govtJobDetails}

      EXAMPLE of properly structured response:
      {
        "jobTitle": "Forest Guard",
        "jobOverview": "UP Forest Department invites applications for Forest Guard and Wildlife Guard positions for forest conservation and wildlife protection duties.",
        "year": "2025",
        "organization": "UP Forest Department",
        "totalVacancies": "800",
        "applicationMode": "Online",
        "jobLocation": "Uttar Pradesh",
        "postNames": ["Forest Guard", "Wildlife Guard"],
        "ageLimitMin": "18",
        "ageLimitMax": "35",
        "applicationFeeGeneral": "500",
        "applicationFee_SC_ST_PWD": "250",
        // ... continue with all other fields
      }

      Generate a complete JSON without any placeholder values or empty strings for basic fields. 
      Make reasonable assumptions for missing information based on typical government job patterns.
      Make sure to generate a unique slug by combining the job title, organization name with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
    `;
    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial govt job JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial govt job data', 
        error: initialResponse.error 
      });
    }
    // Step 2: Enhanced validation and correction
    const validationPrompt = `
      You are a strict JSON validator and data enhancer. Analyze the following JSON and fix these specific issues:

      CRITICAL VALIDATION RULES:
      1. Ensure NO basic string fields are empty - jobTitle, organization, year, totalVacancies MUST have values
      2. If jobTitle is empty, use the first item from postNames array
      3. If organization is empty, create a reasonable government department name
      4. If totalVacancies is empty, sum up the vacancyCounts array values
      5. If year is empty, use "2025"
      6. All array fields must be properly structured arrays
      7. FAQ must be array of objects with 'question' and 'answer' string fields
      8. Ensure slug is URL-friendly (lowercase, hyphens, no spaces)

      SCHEMA REQUIREMENTS:
      - postNames: Must be array of strings
      - educationalQualifications: Must be array of strings
      - additionalRequirements: Must be array of strings
      - vacancyPostNames: Must be array of strings
      - vacancyCounts: Must be array of strings
      - vacancyPayScales: Must be array of strings
      - selectionProcess: Must be array of strings
      - howToApplyOnlineSteps: Must be array of strings
      - howToApplyOfflineSteps: Must be array of strings
      - requiredDocuments: Must be array of strings
      - examSubjects: Must be array of strings
      - examQuestionCounts: Must be array of strings
      - examMarks: Must be array of strings
      - examDurations: Must be array of strings
      - faq: Must be array of objects with 'question' (string) and 'answer' (string) fields
      - keywords: Must be array of strings
      - isFeatured: Must be boolean (true/false)
      - All string fields should be strings, not arrays
      - All array fields should be arrays with proper structure
      - Remove any fields not in the schema

      JSON TO VALIDATE AND FIX:
      ${JSON.stringify(initialResponse.data, null, 2)}

      Return ONLY the corrected JSON. Fix all validation errors, ensure proper data types, correct array structures, and MOST IMPORTANTLY ensure no basic fields are empty strings.
    `;

    const validationResponse = await callOpenRouterAI(validationPrompt, 'Validate and correct JSON');
    
    if (!validationResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to validate govt job data',
        error: validationResponse.error
      });
    }

    let govtJobData = validationResponse.data;

    // Step 3: Enhanced safety checks and manual corrections
    govtJobData = applySafetyChecksForGovtJob(govtJobData);

    // Step 4: Additional validation for critical fields
    const criticalFields = ['jobTitle', 'organization', 'year'];
    const missingCriticalFields = criticalFields.filter(field => !govtJobData[field] || govtJobData[field].trim() === '');
    
    if (missingCriticalFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Critical fields missing: ${missingCriticalFields.join(', ')}`,
        data: govtJobData
      });
    }

    // Step 5: Create and save the govt job
    const govtJob = new GovtJob(govtJobData);
    govtJob.postedBy = user;
    govtJob.createdAt = new Date();
    
    // Validate before saving
    try {
      await govtJob.validate();
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Govt job data validation failed',
        errors: validationError.errors,
        data: govtJobData
      });
    }

    await govtJob.save();

    res.status(201).json({
      success: true,
      message: 'Govt job processed and saved successfully',
      job: govtJob
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process and save govt job',
      error: error.message
    });
  }
};

// Enhanced helper function to call OpenRouter AI
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
            content: `You are a precise JSON generator for government job postings. Always return valid JSON without explanations or markdown formatting. Focus on filling ALL required fields with meaningful data. Context: ${context}` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Lower temperature for more consistent outputs
        max_tokens: 4000 // Ensure enough tokens for complete response
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData };
    }

    const aiResponse = await response.json();
    // Parse the JSON response with better error handling
    const aiContent = aiResponse.choices[0].message.content;
    
    // Try multiple patterns to extract JSON
    let jsonString = aiContent;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = aiContent.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
    }
    
    // Try to find JSON object
    const jsonMatch = jsonString.match(/({[\s\S]*})/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
    
    // Clean up the JSON string
    jsonString = jsonString.trim();
    
    try {
      const parsedData = JSON.parse(jsonString);
      return { success: true, data: parsedData };
    } catch (parseError) {
      return { success: false, error: `JSON parsing failed: ${parseError.message}` };
    }
    
  } catch (error) {
      return { success: false, error: error.message };
  }
}

// Enhanced safety checks and corrections for government jobs
function applySafetyChecksForGovtJob(govtJobData) {

  // Ensure isFeatured is boolean
  if (typeof govtJobData.isFeatured !== 'boolean') {
    govtJobData.isFeatured = false;
  }

  // Define all array fields that should be arrays of strings
  const stringArrayFields = [
    'postNames', 'educationalQualifications', 'additionalRequirements',
    'vacancyPostNames', 'vacancyCounts', 'vacancyPayScales',
    'selectionProcess', 'howToApplyOnlineSteps', 'howToApplyOfflineSteps',
    'requiredDocuments', 'examSubjects', 'examQuestionCounts',
    'examMarks', 'examDurations', 'keywords'
  ];

  // Handle string array fields
  stringArrayFields.forEach(field => {
    if (!Array.isArray(govtJobData[field])) {
      if (typeof govtJobData[field] === 'string' && govtJobData[field].trim() !== '') {
        if (field === 'keywords') {
          govtJobData[field] = govtJobData[field].split(',').map(item => item.trim()).filter(item => item);
        } else {
          govtJobData[field] = govtJobData[field].split('\n').map(item => item.trim()).filter(item => item);
        }
      } else {
        govtJobData[field] = [];
      }
    } else {
      // Ensure all items in array are strings
      govtJobData[field] = govtJobData[field].map(item => String(item)).filter(item => item.trim() !== '');
    }
  });

  // Handle FAQ array (special case - array of objects)
  if (!Array.isArray(govtJobData.faq)) {
    govtJobData.faq = [];
  } else {
    govtJobData.faq = govtJobData.faq.map(item => {
      if (typeof item === 'string') {
        return { question: item, answer: '' };
      }
      return {
        question: String(item.question || ''),
        answer: String(item.answer || '')
      };
    }).filter(item => item.question.trim() !== '');
  }

  // CRITICAL: Extract basic information from array fields if main fields are empty
  if (!govtJobData.jobTitle || govtJobData.jobTitle.trim() === '') {
    if (govtJobData.postNames && govtJobData.postNames.length > 0) {
      govtJobData.jobTitle = govtJobData.postNames[0];
    } else {
      govtJobData.jobTitle = 'Government Job';
    }
  }

  if (!govtJobData.totalVacancies || govtJobData.totalVacancies.trim() === '') {
    if (govtJobData.vacancyCounts && govtJobData.vacancyCounts.length > 0) {
      // Sum up all vacancy counts
      const total = govtJobData.vacancyCounts.reduce((sum, count) => {
        const num = parseInt(count.toString().replace(/\D/g, '')) || 0;
        return sum + num;
      }, 0);
      govtJobData.totalVacancies = total > 0 ? total.toString() : '1';
    } else {
      govtJobData.totalVacancies = '1';
    }
  }

  // Extract organization from keywords if missing
  if (!govtJobData.organization || govtJobData.organization.trim() === '') {
    if (govtJobData.keywords && govtJobData.keywords.length > 0) {
      // Look for department/organization keywords
      const orgKeywords = govtJobData.keywords.filter(keyword => 
        keyword.toLowerCase().includes('department') || 
        keyword.toLowerCase().includes('ministry') ||
        keyword.toLowerCase().includes('board') ||
        keyword.toLowerCase().includes('commission') ||
        keyword.toLowerCase().includes('service')
      );
      if (orgKeywords.length > 0) {
        govtJobData.organization = orgKeywords[0];
      } else {
        govtJobData.organization = 'Government Department';
      }
    } else {
      govtJobData.organization = 'Government Department';
    }
  }

  // Set defaults for critical fields
  if (!govtJobData.year || govtJobData.year.trim() === '') {
    govtJobData.year = '2025';
  }

  if (!govtJobData.applicationMode || govtJobData.applicationMode.trim() === '') {
    govtJobData.applicationMode = 'Online';
  }

  if (!govtJobData.jobLocation || govtJobData.jobLocation.trim() === '') {
    govtJobData.jobLocation = 'India';
  }

  // Generate job overview if missing
  if (!govtJobData.jobOverview || govtJobData.jobOverview.trim() === '') {
    govtJobData.jobOverview = `${govtJobData.organization} has released notification for ${govtJobData.jobTitle} posts with ${govtJobData.totalVacancies} vacancies. Eligible candidates can apply through the official application process.`;
  }

  // Generate notification_about if missing
  if (!govtJobData.notification_about || govtJobData.notification_about.trim() === '') {
    govtJobData.notification_about = `Recruitment notification for ${govtJobData.jobTitle} posts in ${govtJobData.organization}`;
  }

  // Set default age limits if missing
  if (!govtJobData.ageLimitMin || govtJobData.ageLimitMin.trim() === '') {
    govtJobData.ageLimitMin = '18';
  }
  if (!govtJobData.ageLimitMax || govtJobData.ageLimitMax.trim() === '') {
    govtJobData.ageLimitMax = '35';
  }
  if (!govtJobData.ageRelaxation || govtJobData.ageRelaxation.trim() === '') {
    govtJobData.ageRelaxation = 'As per government rules for reserved categories';
  }

  // Set default application fees if missing
  if (!govtJobData.applicationFeeGeneral || govtJobData.applicationFeeGeneral.trim() === '') {
    govtJobData.applicationFeeGeneral = '500';
  }
  if (!govtJobData.applicationFee_SC_ST_PWD || govtJobData.applicationFee_SC_ST_PWD.trim() === '') {
    govtJobData.applicationFee_SC_ST_PWD = '250';
  }
  if (!govtJobData.applicationFeePaymentMode || govtJobData.applicationFeePaymentMode.trim() === '') {
    govtJobData.applicationFeePaymentMode = 'Online';
  }

  // Generate search description if missing
  if (!govtJobData.searchDescription || govtJobData.searchDescription.trim() === '') {
    govtJobData.searchDescription = `Apply for ${govtJobData.jobTitle} posts in ${govtJobData.organization}. Total ${govtJobData.totalVacancies} vacancies available. Check eligibility, application process, and exam pattern.`;
  }

  // Handle slug generation
  if (!govtJobData.slug || govtJobData.slug.trim() === '') {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const jobTitleSlug = govtJobData.jobTitle.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const organizationSlug = govtJobData.organization.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    govtJobData.slug = `${jobTitleSlug}-${organizationSlug}-${formattedDate}`;
  } else {
    // Clean existing slug
    govtJobData.slug = govtJobData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Ensure all string fields are properly formatted
  const allStringFields = [
    'jobTitle', 'jobOverview', 'year', 'organization', 'totalVacancies',
    'applicationMode', 'jobLocation', 'officialWebsite', 'notification_about',
    'notificationReleaseDate', 'applicationStartDate', 'applicationEndDate',
    'examInterviewDate', 'ageLimitMin', 'ageLimitMax', 'ageRelaxation',
    'applicationFeeGeneral', 'applicationFee_SC_ST_PWD', 'applicationFeePaymentMode',
    'notificationPDFLink', 'applyOnlineLink', 'officialWebsiteLink',
    'searchDescription', 'slug'
  ];
  
  allStringFields.forEach(field => {
    if (govtJobData[field] !== undefined && govtJobData[field] !== null) {
      if (Array.isArray(govtJobData[field])) {
        govtJobData[field] = govtJobData[field].join(' ');
      } else {
        govtJobData[field] = String(govtJobData[field]);
      }
    } else {
      govtJobData[field] = '';
    }
  });

  // Final cleanup - remove any undefined or null values
  Object.keys(govtJobData).forEach(key => {
    if (govtJobData[key] === undefined || govtJobData[key] === null) {
      if (stringArrayFields.includes(key) || key === 'faq') {
        govtJobData[key] = [];
      } else if (key === 'isFeatured') {
        govtJobData[key] = false;
      } else {
        govtJobData[key] = '';
      }
    }
  });

  return govtJobData;
}