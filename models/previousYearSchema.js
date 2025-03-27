import mongoose from "mongoose";

const previousYearSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    exam_name: {
        type: String,
    },
    description: {
        type: String,
    },
    subject: {
        type: String,
    },
    year: {
        type: Number,
    },
    difficulty_level: {
        type: String,
        enum: ["Easy", "Medium", "Hard", "Very Hard"]
    },
    category: {
        type: String,
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
    },
    solution_link: {
        type: String
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    slug: {
        type: String,
        unique: true
    },
    keywords: {
        type: [String]
    },
    searchDescription: {
        type: String,
    },
});

export const PreviousYear = mongoose.model("PreviousYear", previousYearSchema);
