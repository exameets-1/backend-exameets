import express from "express";

import {
    getAllScholarships,
    getASingleScholarship,
    getLatestScholarships,
    deleteScholarship,
    updateScholarship,
    createScholarship
} from "../controllers/scholarshipController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Create new scholarship
router.post("/create", isAuthenticated, createScholarship);

// Get all scholarships
router.get("/getall", getAllScholarships);

// Get single scholarship
router.get("/get/:id", getASingleScholarship);

// Get latest scholarships
router.get("/latest", getLatestScholarships);

// Delete scholarship
router.delete("/delete/:id", isAuthenticated, deleteScholarship);

// Update scholarship
router.put("/update/:id", isAuthenticated, updateScholarship);

export default router;
