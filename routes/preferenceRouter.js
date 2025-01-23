import express from "express";
import { updateUserPreferences, getUserPreferences } from "../controllers/preferenceController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.put("/update", isAuthenticated, updateUserPreferences);
router.get("/", isAuthenticated, getUserPreferences);

export default router;
