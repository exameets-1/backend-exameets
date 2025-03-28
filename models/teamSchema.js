import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    strengths: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: false
    },
    linkedin: {
        type: String,
        required: true
    },
    github: {
        type: String,
        required: true
    },
    certificates: {
        type: [String],
        default : []
    }
});

export const Team = mongoose.model("Team", teamSchema);