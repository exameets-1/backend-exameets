import mongoose from "mongoose";

const govtJobSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
    },
    jobOverview: {
        type: String,
    },
    year: {
        type: String,
    },
    organization: {
        type: String,
    },
    postNames: {
        type: [String],
    },
    totalVacancies: {
        type: String,
    },
    applicationMode: {
        type: String,
    },
    jobLocation: {
        type: String,
    },
    officialWebsite: {
        type: String,
    },
    notification_about: {
        type: String,
    },
  
  // Important Dates
    notificationReleaseDate: {
        type: String,
    },
    applicationStartDate: {
        type: String,
    },
    applicationEndDate: {
        type: String,
    },
    examInterviewDate: {
        type: String,
    },
  
  // Eligibility Criteria
    educationalQualifications: {
        type: [String],
    },
    ageLimitMin: {
        type: String,
    },
    ageLimitMax: {
        type: String,
    },
    ageRelaxation: {
        type: String,
    },
    additionalRequirements: {
        type: [String],
    },
  
  // Vacancy Details
    vacancyPostNames: {
        type: [String],
    },
    vacancyCounts: {
        type: [String],
    },
    vacancyPayScales: {
        type: [String],
    },
  
  // Application Fee
    applicationFeeGeneral: {
        type: String,
    },
    applicationFee_SC_ST_PWD : {
        type: String,
    },
    applicationFeePaymentMode: {
        type: String,
    },
  
  // Selection Process
    selectionProcess: {
        type: [String],
    },
  
  // How to Apply
    howToApplyOnlineSteps: {
        type: [String],
    },
    howToApplyOfflineSteps: {
        type: [String],
    },
  
  // Documents
    requiredDocuments: {
        type: [String],
    },
  
  // Exam Pattern
    examSubjects: {
        type: [String],
    },
    examQuestionCounts: {
        type: [String],
    },
    examMarks: {
        type: [String],
    },
    examDurations: {
        type: [String],
    },
  
  // Links
    notificationPDFLink: {
        type: String,
    },
    applyOnlineLink: {
        type: String,
    },
    officialWebsiteLink: {
        type: String,
    },

  
  // FAQs questions and answers
    faq: {
        type: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: () => new mongoose.Types.ObjectId(),
                auto: true
            },
            question: String,
            answer: String
        }],
        default: []
    },
    keywords: {
        type: [String],
    },
    searchDescription: {
        type: String,
    },
    slug: {
        //title and date at the end
        type: String,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


export const GovtJob = mongoose.model('GovtJob', govtJobSchema);
