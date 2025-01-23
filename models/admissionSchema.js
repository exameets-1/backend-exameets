import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    institution: {
        type: String,
        required: true,
    },
    program: {
        type: String,
        required: true,
    },
    degree: {
        type: String,
        required: true,
    },
    applicationDeadline: {
        type: Date,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    eligibility: {
        type: String,
        required: true,
    },
    applicationFee: {
        domestic: {
            type: Number,
            required: true,
        },
        international: {
            type: Number,
            required: true,
        }
    },
    tuitionFee: {
        domestic: {
            type: Number,
            required: true,
        },
        international: {
            type: Number,
            required: true,
        }
    },
    seats: {
        total: {
            type: Number,
            required: true,
        },
        reserved: {
            type: Number,
            required: true,
        }
    },
    location: {
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        }
    },
    requirements: [{
        type: String,
        required: true,
    }],
    documents: [{
        type: String,
        required: true,
    }],
    applicationProcess: {
        type: String,
        required: true,
    },
    applicationLink: {
        type: String,
        required: true,
    },
    brochureLink: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: true,
    },
    scholarships: [{
        name: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        criteria: {
            type: String,
            required: true,
        }
    }],
    status: {
        type: String,
        enum: ['Open', 'Closing Soon', 'Closed'],
        default: 'Open'
    },
    post_date: {
        type: Date,
        default: Date.now,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
});

export const Admission = mongoose.model("Admission", admissionSchema);
