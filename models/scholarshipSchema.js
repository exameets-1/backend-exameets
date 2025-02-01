import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please enter scholarship title"],
        trim: true
    },
    organization: {
        type: String,
        required: [true, "Please enter organization name"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please enter scholarship description"]
    },
    eligibility_criteria: {
        type: String,
        required: [true, "Please enter eligibility criteria"]
    },
    amount: {
        type: String,
        required: [true, "Please enter scholarship amount"]
    },
    application_link: {
        type: String,
        required: [true, "Please enter application link"]
    },
    start_date: {
        type: Date,
        required: [true, "Please enter start date"]
    },
    last_date: {
        type: Date,
        required: [true, "Please enter last date to apply"]
    },
    category: {
        type: String,
        required: [true, "Please enter scholarship category"],
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
        required: [true, "Please enter required qualification"]
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    post_date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Scholarship = mongoose.model("Scholarship", scholarshipSchema);
