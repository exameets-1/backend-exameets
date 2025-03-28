import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
    },
    category: {
        type: String,
        enum: ['IT', 'NON-IT'],
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    positionType: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contract'],
    },
    companyName: {
        type: String,
    },
    companyOverview: {
        type: String,
    },
    positionSummary: {
        type: String,
    },
    keyResponsibilities: {
        type: [String],
        validate: [(arr) => arr.length >= 1, '{PATH} must have at least 1 item'],
    },
    education: {
        type: [String],
    },
    experience: {
        type: String,
    },
    languages: {
        type: [String],
        default: [],
    },
    frameworks: {
        type: [String],
        default: [],
    },
    databases: {
        type: [String],
        default: [],
    },
    methodologies: {
        type: [String],
        default: [],
    },
    softSkills: {
        type: [String],
    },
    preferredQualifications: {
        type: [String],
        default: [],
    },
    startDate: {
        type: String,
        required: false,
    },
    applicationDeadline: {
        type: String,
        required: false,
    },
    benefits: {
        type: [String],
    },
    submissionMethod: {
        type: String,
        enum: ['email', 'portal'],
    },
    contactEmail: {
        type: String,
        required: function () {
            return this.submissionMethod === 'email';
        },
    },
    applicationPortalLink: {
        type: String,
        required: function () {
            return this.submissionMethod === 'portal';
        },
    },
    jobReferenceNumber: {
        type: String,
    },
    equalOpportunityStatement: {
        type: String,
    },
    slug: {
        type: String,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    keywords: {
        type: [String],
    },
    searchDescription: {
        type: String,
    },
    faq: {
        type: [{
            question: String,
            answer: String,
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: () => new mongoose.Types.ObjectId(),
                auto: true
            }
        }],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    postedBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});


export const Job = mongoose.model('Job', jobPostingSchema);
