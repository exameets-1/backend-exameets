import mongoose from "mongoose";

const intershShipSchema = new mongoose.Schema({

    internship_type: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    start_date: {
        type: String,
        required: true,
    },  
    duration: {
        type: String,
        required: true,
    },
    skills_required: {
        type: [String],
        required: true,
    },
    stipend: {
        type: String,
        required: true,
    },
    post_date: {
        type: Date,
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
    qualification: {
        type: String,
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
    last_date: {
        type: String,
        required: true,
    },
    is_featured: {
        type: Boolean,
        required: true,
    },
    field : {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export const Internship = mongoose.model('Internship', intershShipSchema);
