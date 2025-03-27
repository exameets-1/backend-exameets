import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({  
    title: {
        type: String,
        trim: true
    },
    organization: {
        type: String,
        trim: true
    },
    postName : {
        type: String,
        trim: true
    },
    totalVacancies: {
        type: String,
        required: true
    },
    exam_type : {
        type: String,
        trim: true,
        default: "Written Exam"
    },
    resultDate : {
        type: String,
        trim: true
    },
    nextSteps : {
        type : [String],
    },
    officialWebsite : {
        type: String,
    },
    importantDates : [{
        event : {
            type: String,
            
        },
        date : {
            type: String,
            
        }
    }],
    stepsToCheckResult : {
        type : [String],
    },
    cutoffMarks : [{
        category : {
            type : String,
        },
        marks : {
            type : String
        }
    }],
    importantLinks : {
        resultLink : String,
        meritListLink : String,
        cutoffLink : String,
        nextStepsLink : String,
        aboutJobLink : String
    },
    nextStepsDescription : {
        type : String,
    },
    documentsRequired: {
        type : [String],
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    keywords: {
        type: [String],
        trim: true
    },
    searchDescription : {
        type : String,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});         

export const Result = mongoose.model("Result", resultSchema);