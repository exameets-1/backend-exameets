import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please enter admission title"],
        trim: true
    },
    institute: {
        type: String,
        required: [true, "Please enter institute name"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please enter admission description"]
    },
    eligibility_criteria: {
        type: String,
        required: [true, "Please enter eligibility criteria"]
    },
    course: {
        type: String,
        required: [true, "Please enter course name"]
    },
    application_link: {
        type: String,
        required: [true, "Please enter application link"]
    },
    start_date: {
        type: String,
        required: [true, "Please enter start date"]
    },
    last_date: {
        type: String,
        required: [true, "Please enter last date to apply"]
    },
    category: {
        type: String,
        required: [true, "Please enter admission category"],
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
        required: [true, "Please enter course fees"]
    },
    location: {
        type: String,
        required: [true, "Please enter institute location"]
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    post_date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Admission = mongoose.model("Admission", admissionSchema);
