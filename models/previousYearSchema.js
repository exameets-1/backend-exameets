import mongoose from "mongoose";

const previousYearSchema = new mongoose.Schema({
    
    year: {
        type: Number,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    difficulty_level: {
        type: String,
        required: false,
    },
    post_date: {
        type: String,
        required: true,
    },
    organization: {
        type: String,
        required: false,
    },
    result_link: {
        type: String,
        required: false,
    },
    file_url: {
        type: String,
        required: true,
    },
})

export const PreviousYear = mongoose.model('PreviousYear', previousYearSchema);

