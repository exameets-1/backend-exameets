import mongoose from "mongoose"

const admitCardSchema = new mongoose.Schema({
    title : {
        type : String
    },
    organization : {
        type : String
    },
    advertisementNumber : {
        type : String
    },
    importantDates : [{
        event : {
            type : String
        },
        date : {
            type : String
        }
    }],
    examDetails : [{
        examDate : {
            type : String
        },
        shiftTimings : {
            type : String
        },
        reportingTime : {
            type : String
        }
    }],
    vacancies : {
        type : String
    },
    downloadSteps : [{
        type : String
    }],
    importantLinks : [{
        linkType : {
            type : String
        },
        link : {
            type : String
        }
    }],
    instructions : [{
        type : String
    }],
    officialWebsite : {
        type : String
    },
    slug : {
        type : String
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
    createdAt : {
        type : Date,
        default : Date.now
    },
    postedBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

export const AdmitCard = mongoose.model("AdmitCard", admitCardSchema)