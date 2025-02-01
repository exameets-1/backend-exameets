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
                    { role: searchRegex },
                    { organization: searchRegex },
                    { description: searchRegex },
                    { job_type: searchRegex },
                    { location: searchRegex },
                    { eligibility_criteria: searchRegex },
                    { skills_required: searchRegex }
                ]
            }).sort({ post_date: -1 }).limit(5),
            
            GovtJob.find({
                $or: [
                    { job_type: searchRegex },
                    { department: searchRegex },
                    { organization: searchRegex },
                    { location: searchRegex },
                    { eligibility_criteria: searchRegex },
                    { description: searchRegex }
                ]
            }).sort({ post_date: -1 }).limit(5),

            Internship.find({
                $or: [
                    { title: searchRegex },
                    { organization: searchRegex },
                    { description: searchRegex },
                    { location: searchRegex },
                    { eligibility_criteria: searchRegex },
                    { internship_type: searchRegex },
                    { skills_required: searchRegex },
                    { qualification: searchRegex }
                ]
            }).sort({ post_date: -1 }).limit(5),

            Scholarship.find({
                $or: [
                    { title: searchRegex },
                    { organization: searchRegex },
                    { description: searchRegex },
                    { eligibility_criteria: searchRegex },
                    { category: searchRegex }
                ]
            }).sort({ start_date: -1 }).limit(5),

            Result.find({
                $or: [
                    { exam_title: searchRegex },
                    { organization: searchRegex },
                    { description: searchRegex }
                ]
            }).sort({ result_date: -1 }).limit(5),

            AdmitCard.find({
                $or: [
                    { title: searchRegex },
                    { organization: searchRegex },
                    { description: searchRegex },
                    { eligibility_criteria: searchRegex }
                ]
            }).sort({ exam_date: -1 }).limit(5),

            Admission.find({
                $or: [
                    { title: searchRegex },
                    { institute: searchRegex },
                    { description: searchRegex },
                    { eligibility_criteria: searchRegex },
                    { course: searchRegex },
                    { category: searchRegex }
                ]
            }).sort({ start_date: -1 }).limit(5),

            PreviousYear.find({
                $or: [
                    { title: searchRegex },
                    { exam_name: searchRegex },
                    { description: searchRegex },
                    { subject: searchRegex },
                    { category: searchRegex },
                    { difficulty_level: searchRegex }
                ]
            }).sort({ year: -1 }).limit(5)
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
                            return new Date(item.post_date);
                        case 'scholarship':
                        case 'admission':
                            return new Date(item.start_date);
                        case 'result':
                            return new Date(item.result_date);
                        case 'admitcard':
                            return new Date(item.exam_date);
                        case 'previousyear':
                            return new Date(item.year, 0, 1); // Convert year to date
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
