import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    organization: {
        type: String,
    },
    description: {
        type: String,
    },
    eligibility_criteria: {
        type: String,
    },
    amount: {
        type: String,
    },
    application_link: {
        type: String,
    },
    start_date: {
        type: String,
    },
    last_date: {
        type: String,
    },
    category: {
        type: String,
        enum: [
            'Merit-based',
            'Need-based',
            'Research',
            'Sports',
            'Cultural',
            'International',
            'Government',
            'Private',
            'Other'
        ]
    },
    qualification: {
        type: String,
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    keywords: {
        type: [String],
        default: []
    },
    searchDescription: {
        type: String,
    },
    slug: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Scholarship = mongoose.model("Scholarship", scholarshipSchema);
