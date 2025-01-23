import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
    title: {
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
    examDate: {
        type: Date,
        required: true,
    },
    registrationStartDate: {
        type: Date,
        required: true,
    },
    registrationEndDate: {
        type: Date,
        required: true,
    },
    eligibility: {
        type: String,
        required: true,
    },
    applicationFee: {
        general: {
            type: Number,
            required: true,
        },
        reserved: {
            type: Number,
            required: true,
        }
    },
    ageLimit: {
        min: {
            type: Number,
            required: true,
        },
        max: {
            type: Number,
            required: true,
        }
    },
    vacancies: {
        type: Number,
        required: true,
    },
    examPattern: {
        type: String,
        required: true,
    },
    syllabus: {
        type: String,
        required: true,
    },
    applicationLink: {
        type: String,
        required: true,
    },
    notificationLink: {
        type: String,
        required: true,
    },
    post_date: {
        type: Date,
        default: Date.now,
    }
});

export const Exam = mongoose.model("Exam", examSchema);