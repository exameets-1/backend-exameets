import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    institute: {
        type: String,
    },
    description: {
        type: String,
    },
    eligibility_criteria: {
        type: String,
    },
    course: {
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
            'Engineering',
            'Medical',
            'Arts',
            'Science',
            'Commerce',
            'Management',
            'Law',
            'Design',
            'Other'
        ]
    },
    fees: {
        type: String,
    },
    location: {
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
    },
    postedBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

export const Admission = mongoose.model("Admission", admissionSchema);
