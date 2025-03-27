import { Job } from '../models/jobSchema.js';
import { GovtJob } from '../models/govtJobSchema.js';
import { Internship } from '../models/internshipSchema.js';
import { Scholarship } from '../models/scholarshipSchema.js';
import { Result } from '../models/resultSchema.js';
import { AdmitCard } from '../models/admitCardSchema.js';
import { Admission } from '../models/admissionSchema.js';
import { PreviousYear } from '../models/previousYearSchema.js';

export const searchAcrossCollections = async (req, res) => {
    try {
        const { q } = req.query;
        

        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = new RegExp(q, 'i');
        

        // Perform parallel searches across all collections
        const [jobs, govtJobs, internships, scholarships, results, admitCards, admissions, previousYears] = await Promise.all([
            Job.find({ 
                $or: [
                    { jobTitle: searchRegex },
                    { companyName: searchRegex },
                    { description: searchRegex },
                    { positionType: searchRegex },
                    { location: searchRegex },
                    { companyOverview: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5),
            
            GovtJob.find({
                $or: [
                    { jobTitle: searchRegex },
                    { jobOverview: searchRegex },
                    { organization: searchRegex },
                    { jobLocation: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5),

            Internship.find({
                $or: [
                    { title: searchRegex },
                    { organization: searchRegex },
                    { description: searchRegex },
                    { location: searchRegex },
                    { internship_type: searchRegex },
                    { skills_required: searchRegex },
                    { qualification: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5),

            Scholarship.find({
                $or: [
                    { title: searchRegex },
                    { organization: searchRegex },
                    { description: searchRegex },
                    { eligibility_criteria: searchRegex },
                    { category: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5),

            Result.find({
                $or: [
                    { title: searchRegex },
                    { organization: searchRegex },
                    { postName: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5),

            AdmitCard.find({
                $or: [
                    { title: searchRegex },
                    { organization: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5),

            Admission.find({
                $or: [
                    { title: searchRegex },
                    { institute: searchRegex },
                    { description: searchRegex },
                    { eligibility_criteria: searchRegex },
                    { course: searchRegex },
                    { category: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5),

            PreviousYear.find({
                $or: [
                    { title: searchRegex },
                    { exam_name: searchRegex },
                    { description: searchRegex },
                    { subject: searchRegex },
                    { category: searchRegex },
                    { difficulty_level: searchRegex },
                    { keywords: searchRegex },
                    { searchDescription: searchRegex }
                ]
            }).sort({ createdAt: -1 }).limit(5)
        ]);


        // Combine and format results
        const allResults = [
            ...jobs.map(item => ({ ...item.toObject(), type: 'job' })),
            ...govtJobs.map(item => ({ ...item.toObject(), type: 'govtjob' })),
            ...internships.map(item => ({ ...item.toObject(), type: 'internship' })),
            ...scholarships.map(item => ({ ...item.toObject(), type: 'scholarship' })),
            ...results.map(item => ({ ...item.toObject(), type: 'result' })),
            ...admitCards.map(item => ({ ...item.toObject(), type: 'admitcard' })),
            ...admissions.map(item => ({ ...item.toObject(), type: 'admission' })),
            ...previousYears.map(item => ({ ...item.toObject(), type: 'previousyear' }))
        ];

        // Sort by the most relevant date field for each type
        const sortedResults = allResults
            .sort((a, b) => {
                const getDate = (item) => {
                    switch(item.type) {
                        case 'job':
                        case 'govtjob':
                        case 'internship':
                            return new Date(item.createdAt);
                        case 'scholarship':
                        case 'admission':
                            return new Date(item.createdAt);
                        case 'result':
                            return new Date(item.createdAt);
                        case 'admitcard':
                            return new Date(item.createdAt);
                        case 'previousyear':
                            return new Date(item.createdAt);
                        default:
                            return new Date(0);
                    }
                };
                return getDate(b) - getDate(a);
            })
            .slice(0, 5);


        res.json(sortedResults);
    } catch (error) {
        res.status(500).json({ message: 'Error performing global search', error: error.message });
    }
};
