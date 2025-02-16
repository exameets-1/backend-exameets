import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['IT', 'NON-IT']
    },
    job_type: {
        type: String,
        required: true,
    },
    organization: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    experience_required: {
        type: String,
        required: true,
    },
    skills_required: {
        type: [String],
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
    description: {
        type: String,
        required: true,
    },
    salary_range: {
        type: String,
        required: true,
    },
    last_date: {
        type: String,
        required: true,
    },
    valid_until: {
        type: String,
        required: true,
    },
    vacancy: { 
        type: String,
        required: true,
    },
    qualification: {
        type: String,
        required: true,
    },
    notification_about : {
        type : String,
        required : true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Job = mongoose.model("Job", jobSchema);