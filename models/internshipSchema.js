import mongoose from "mongoose";

const intershShipSchema = new mongoose.Schema({

    internship_type: {
        type: String,
    },
    title: {
        type: String,
    },
    imageUrl : {
        type: String,
    },
    start_date: {
        type: String,
    },  
    duration: {
        type: String,
    },
    skills_required: {
        type: [String],
    },
    stipend: {
        type: String,
    },
    organization: {
        type: String,
    },
    location: {
        type: String,
    },
    qualification: {
        type: String,
    },
    eligibility_criteria: [{
        type: String,
    }],
    application_link: {
        type: String,
    },
    last_date: {
        type: String,
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    field : {
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    slug: {
        type: String,
        unique: true
    },
    keywords : {
        type: [String],
    },
    searchDescription: {
        type: String,
    },
    postedBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

export const Internship = mongoose.model('Internship', intershShipSchema);
