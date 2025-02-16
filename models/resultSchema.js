import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({  
    exam_title: {
        type: String,
        required: true
    },
    result_date: {
        type: String,
        required: true
    },
    exam_date: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    result_link: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});         

export const Result = mongoose.model("Result", resultSchema);