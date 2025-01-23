import { User } from "../models/userSchema.js";

export const updateUserPreferences = async (req, res) => {
    try {
        const { examNotifications, isStudying, educationLevel } = req.body;

        // Validate input
        if (!examNotifications || isStudying === undefined || !educationLevel) {
            return res.status(400).json({
                success: false,
                message: "Please provide all preference fields"
            });
        }

        // Update user preferences
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.preferences = {
            examNotifications,
            isStudying,
            educationLevel,
            preferencesSet: true
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: "Preferences updated successfully",
            preferences: user.preferences
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getUserPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            preferences: user.preferences
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
