import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Job } from "../models/jobSchema.js";
import fetch from 'node-fetch';

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { city, job_type, searchKeyword, page = 1, limit = 8 } = req.query;
  const query = {};

  // Filter by city
  if (city && city !== "All") {
    query.city = { $regex: city, $options: "i" };
  }

  // Filter by position type
  if (job_type && job_type !== "All") {
    query.positionType = job_type;
  }

  // Search across multiple fields
  if (searchKeyword) {
    query.$or = [
      { jobTitle: { $regex: searchKeyword, $options: "i" } },
      { companyName: { $regex: searchKeyword, $options: "i" } },
      { experience: { $regex: searchKeyword, $options: "i" } },
      { languages: { $in: [new RegExp(searchKeyword, 'i')] } },
      { frameworks: { $in: [new RegExp(searchKeyword, 'i')] } },
      { databases: { $in: [new RegExp(searchKeyword, 'i')] } },
      { methodologies: { $in: [new RegExp(searchKeyword, 'i')] } },
      { softSkills: { $in: [new RegExp(searchKeyword, 'i')] } }
    ];
  }

  const skip = (page - 1) * limit;
  const totalJobs = await Job.countDocuments(query);

  const jobs = await Job.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 }); // Updated sorting field

  res.status(200).json({
    success: true,
    jobs,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalJobs / limit),
    totalJobs,
  });
});

export const getASingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id);

  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  res.status(200).json({
    success: true,
    job,
  });
});

export const getLatestJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find()
    .sort({ "metadata.createdAt": -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    jobs
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id);
  
  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const jobId = req.params.id;
  const updates = req.body;

  // Get allowed updates from schema paths (dynamic and maintainable)
  const schemaPaths = Object.keys(Job.schema.paths);
  const immutableFields = ['_id', 'createdAt'];
  const allowedUpdates = schemaPaths.filter(
    path => !immutableFields.includes(path)
  );

  // Filter valid updates
  const validUpdates = Object.keys(updates).filter(key => 
    allowedUpdates.includes(key)
  );

  if (validUpdates.length === 0) {
    return next(new ErrorHandler('No valid fields to update', 400));
  }

  // Create update object
  const updateObject = {};
  validUpdates.forEach(key => {
    updateObject[key] = updates[key];
  });

  // Handle update with proper validation
  const updatedJob = await Job.findByIdAndUpdate(
    jobId,
    updateObject,
    { 
      new: true,
      runValidators: true, // Ensures schema validations run
      context: 'query' // Needed for proper $set validation
    }
  );

  if (!updatedJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    job: updatedJob
  });
});

export const createJob = catchAsyncErrors(async (req, res, next) => {
  // Validate conditional submission requirements
  if (req.body.submissionMethod === 'email' && !req.body.contactEmail) {
    return next(new ErrorHandler('Contact email is required for email submissions', 400));
  }
  if (req.body.submissionMethod === 'portal' && !req.body.applicationPortalLink) {
    return next(new ErrorHandler('Application portal link is required for portal submissions', 400));
  }

  if (req.body.keywords && !Array.isArray(req.body.keywords)) {
    return next(new ErrorHandler('Keywords must be an array', 400));
  }

  if (req.body.searchDescription && req.body.searchDescription.length > 160) {
    return next(new ErrorHandler('Search description must be less than 160 characters', 400));
  }

  // Prepare job data with defaults
  const jobData = {
    ...req.body,
    keywords: req.body.keywords || [],
    searchDescription: req.body.searchDescription || '',
    // Set empty arrays for optional technical skills
    languages: req.body.languages || [],
    frameworks: req.body.frameworks || [],
    databases: req.body.databases || [],
    methodologies: req.body.methodologies || [],
    preferredQualifications: req.body.preferredQualifications || [],
    // Initialize optional fields
    startDate: req.body.startDate || null,
    applicationDeadline: req.body.applicationDeadline || null,
    postedBy : req.user._id
  };

  // Let Mongoose handle schema validation
  const newJob = await Job.create(jobData);
  
  res.status(201).json({
    success: true,
    job: newJob,
    message: "Job created successfully"
  });
});

// Additional category-based controllers

export const getAllITJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ category: "IT" });
  
  res.status(200).json({
    success: true,
    jobs
  });
});

export const getAllNonITJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ category: { $ne: "IT" } });
  
  res.status(200).json({
    success: true,
    jobs
  });
});

export const getFeaturedJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ "dates.applicationDeadline": { $gt: new Date() } })
    .sort({ "metadata.createdAt": -1 })
    .limit(3);

  res.status(200).json({
    success: true,
    jobs
  });
});


// export const processJobDetails = async (req, res) => {
//   try {
//     const { jobDetails } = req.body;
//     const user = req.user._id;
    
//     if (!jobDetails) {
//       return res.status(400).json({ success: false, message: 'Job details are required' });
//     }

//     // Prepare the prompt for OpenRouter AI
//     const prompt = `
//       Create a job posting JSON based on the following details. Follow this exact schema without using placeholder data:
//       ${JSON.stringify(Job.schema.obj, null, 2)}
      
//       Job Details:
//       ${jobDetails}
      
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
//           { role: 'system', content: 'You are a helpful assistant that generates structured job posting data in JSON format.' },
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
//     let jobData;
//     try {
//       const aiContent = aiResponse.choices[0].message.content;
//       // Extract JSON from potential markdown or text format
//       const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
//       const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
//       jobData = JSON.parse(jsonString.trim());
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
//     if (!jobData.slug) {
//       const date = new Date();
//       const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
//       jobData.slug = `${jobData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
//     }

//     // Create and save the job in the database
//     const job = new Job(jobData); //add postedBy field from req.user
//     job.postedBy = user; // Ensure the job is associated with the user
//     job.createdAt = new Date(); // Set createdAt to now
//     console.log('Job data to be saved:', job);
//     await job.save();

//     res.status(201).json({
//       success: true,
//       message: 'Job processed and saved successfully',
//       job
//     });
//   } catch (error) {
//     console.error('Error in job processing:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process and save job',
//       error: error.message
//     });
//   }
// };

export const processJobDetails = async (req, res) => {
  try {
    const { jobDetails } = req.body;
    const user = req.user._id;
    
    if (!jobDetails) {
      return res.status(400).json({ success: false, message: 'Job details are required' });
    }

    // Step 1: Initial AI generation
    const initialPrompt = `
      Create a job posting JSON based on the following details. Follow this exact schema:
      ${JSON.stringify(Job.schema.obj, null, 2)}
      
      Job Details:
      ${jobDetails}
      
      Generate a complete JSON without any placeholder values. Use empty strings for missing information.
      Make sure to generate a unique slug by combining the job title, company name with today's date.
      Ensure the slug is URL-friendly (lowercase, hyphens instead of spaces).
      Do not include createdAt, updatedAt, or postedBy fields.
      Return only valid JSON without explanations.
    `;

    const initialResponse = await callOpenRouterAI(initialPrompt, 'Generate initial job posting JSON');
    
    if (!initialResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate initial job data', 
        error: initialResponse.error 
      });
    }

    // Step 2: Validation and correction
    const validationPrompt = `
      You are a strict JSON validator. Analyze the following JSON against the schema requirements and fix any issues:

      SCHEMA REQUIREMENTS:
      - category: Must be exactly 'IT' or 'NON-IT'
      - positionType: Must be exactly 'Full-Time', 'Part-Time', or 'Contract'  
      - submissionMethod: Must be exactly 'email' or 'portal'
      - If submissionMethod is 'email', contactEmail is required
      - If submissionMethod is 'portal', applicationPortalLink is required
      - keyResponsibilities: Must be an array with at least 1 item
      - All array fields should be arrays, not strings
      - All string fields should be strings, not arrays
      - Remove any fields not in the schema
      - Ensure slug is URL-friendly (lowercase, hyphens, no spaces)

      JSON TO VALIDATE AND FIX:
      ${JSON.stringify(initialResponse.data, null, 2)}

      Return ONLY the corrected JSON. Fix all validation errors, ensure proper data types, and make sure all enum values are exact matches. If any required conditional fields are missing, add them with appropriate values.
    `;

    const validationResponse = await callOpenRouterAI(validationPrompt, 'Validate and correct JSON');
    
    if (!validationResponse.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to validate job data', 
        error: validationResponse.error 
      });
    }

    let jobData = validationResponse.data;

    // Step 3: Final safety checks and manual corrections
    jobData = applySafetyChecks(jobData);

    // Step 4: Create and save the job
    const job = new Job(jobData);
    job.postedBy = user;
    job.createdAt = new Date();
    
    // Validate before saving
    try {
      await job.validate();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Job data validation failed',
        errors: validationError.errors
      });
    }

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job processed and saved successfully',
      job
    });

  } catch (error) {
    console.error('Error in job processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save job',
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
            content: `You are a precise JSON generator for job postings. Always return valid JSON without explanations. Context: ${context}` 
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
function applySafetyChecks(jobData) {
  // Ensure required enums have valid values
  if (!['IT', 'NON-IT'].includes(jobData.category)) {
    jobData.category = 'IT'; // Default fallback
  }
  
  if (!['Full-Time', 'Part-Time', 'Contract'].includes(jobData.positionType)) {
    jobData.positionType = 'Full-Time'; // Default fallback
  }
  
  if (!['email', 'portal'].includes(jobData.submissionMethod)) {
    jobData.submissionMethod = 'email'; // Default fallback
  }

  // Ensure conditional requirements
  if (jobData.submissionMethod === 'email' && !jobData.contactEmail) {
    jobData.contactEmail = 'hr@company.com'; // Placeholder that should be updated
  }
  
  if (jobData.submissionMethod === 'portal' && !jobData.applicationPortalLink) {
    jobData.applicationPortalLink = 'https://company.com/careers'; // Placeholder
  }

  // Ensure keyResponsibilities is an array with at least one item
  if (!Array.isArray(jobData.keyResponsibilities) || jobData.keyResponsibilities.length === 0) {
    jobData.keyResponsibilities = ['Perform assigned duties and responsibilities'];
  }

  // Ensure all array fields are arrays
  const arrayFields = ['keyResponsibilities', 'education', 'languages', 'frameworks', 'databases', 'methodologies', 'softSkills', 'preferredQualifications', 'benefits', 'keywords'];
  arrayFields.forEach(field => {
    if (jobData[field] && !Array.isArray(jobData[field])) {
      if (typeof jobData[field] === 'string') {
        jobData[field] = jobData[field].split(',').map(item => item.trim()).filter(item => item);
      } else {
        jobData[field] = [];
      }
    }
    if (!jobData[field]) {
      jobData[field] = [];
    }
  });

  // Ensure slug is URL-friendly
  if (jobData.slug) {
    jobData.slug = jobData.slug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate slug if missing
  if (!jobData.slug && jobData.jobTitle) {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const companySlug = jobData.companyName ? jobData.companyName.toLowerCase().replace(/\s+/g, '-') : 'company';
    jobData.slug = `${jobData.jobTitle.toLowerCase().replace(/\s+/g, '-')}-${companySlug}-${formattedDate}`;
  }

  // Remove any undefined or null values
  Object.keys(jobData).forEach(key => {
    if (jobData[key] === undefined || jobData[key] === null) {
      if (arrayFields.includes(key)) {
        jobData[key] = [];
      } else {
        jobData[key] = '';
      }
    }
  });

  return jobData;
}