import mongoose from "mongoose";

const govtJobSchema = new mongoose.Schema({
    
    job_type: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    organization: {
        type: String,
        required: true,
    },
    post_date: {
        type: Date,
        required: true,
    },
    eligibility_criteria: {
        type: String,
        required: true,
    },
    application_link: {
        type: String,
        required: true,
    },
    salary_range: {
        type: String,
        required: false,
    },
    last_date: {
        type: String,
        required: true,
    },
    is_featured: {
        type: Boolean,
        required: true,
    },
    valid_until: {
        type: String,
        required: false,
    },
    result_link: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: true,
    },
    qualifications: {
        type: String,
        required: true,
    },
    role : {
        type: String,
        required: true
    },
    vacancy : {
        type: String,
        required: true
    },
    post : {
        type: String,
        required: true
    }
})

export const GovtJob = mongoose.model('GovtJob', govtJobSchema);
