import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    academicYear:{
        type: String,
        required: true,
    },
    qualification : {
        type: String,
        required: true,
    },
    registrationStartDate: {
        type: String,
        required: true,
    },
    registrationCloseDate: {
        type: String,
        required: true,
    },
    caste: {
        type: String,
        required: true,
    },
    financialStatus: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    organization: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    eligibility: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    category: {
        type: String,
        enum: ['Merit-based', 'Need-based', 'Research', 'Sports', 'Cultural', 'International', 'Other'],
        required: true,
    },
    educationLevel: {
        type: String,
        enum: ['High School', 'Undergraduate', 'Graduate', 'Doctorate', 'All Levels'],
        required: true,
    },
    applicationLink: {
        type: String,
        required: true,
    },
    requirements: [{
        type: String,
        required: true,
    }],
    benefits: [{
        type: String,
        required: true,
    }],
    country: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

});

export const Scholarship = mongoose.model("Scholarship", scholarshipSchema);
