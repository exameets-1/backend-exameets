import mongoose from "mongoose";

const previousYearSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please enter paper title"],
        trim: true
    },
    exam_name: {
        type: String,
        required: [true, "Please enter exam name"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please enter paper description"]
    },
    subject: {
        type: String,
        required: [true, "Please enter subject"]
    },
    year: {
        type: Number,
        required: [true, "Please enter year"]
    },
    difficulty_level: {
        type: String,
        required: [true, "Please enter difficulty level"],
        enum: ["Easy", "Medium", "Hard", "Very Hard"]
    },
    category: {
        type: String,
        required: [true, "Please enter category"],
        enum: [
            "Engineering",
            "Medical",
            "Civil Services",
            "Banking",
            "Railways",
            "Teaching",
            "Defence",
            "State Services",
            "Other"
        ]
    },
    paper_link: {
        type: String,
        required: [true, "Please provide paper link"]
    },
    solution_link: {
        type: String
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
});

export const PreviousYear = mongoose.model("PreviousYear", previousYearSchema);
