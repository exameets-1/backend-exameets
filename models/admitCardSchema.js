import mongoose from "mongoose"

const admitCardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    exam_date : {
        type: String,
        required: true
    },
    registration_start_date: {
        type: String,
        required: true
    },
    registration_end_date: {
        type: String,
        required: true
    },
    eligibility_criteria: {
        type: String,
        required: true
    },
    download_link: {
        type: String,
        required: true
    },
    organization : {
        type: String,
        required: true
    }
})

export const AdmitCard = mongoose.model("AdmitCard", admitCardSchema)