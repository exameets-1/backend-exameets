import mongoose from 'mongoose';

const whatsNewSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['job', 'internship', 'course', 'exam', 'admission']
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Item ID is required'],
        refPath: 'type'
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware to maintain only 10 entries
whatsNewSchema.pre('save', async function(next) {
    const WhatsNew = this.constructor;
    const count = await WhatsNew.countDocuments();
    
    if (count >= 10) {
        // Find and delete the oldest entry
        const oldestEntry = await WhatsNew.findOne().sort({ addedAt: 1 });
        if (oldestEntry) {
            await WhatsNew.deleteOne({ _id: oldestEntry._id });
        }
    }
    next();
});

const WhatsNew = mongoose.model('WhatsNew', whatsNewSchema);
export default WhatsNew;
