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
router.route("/getall").get(getAllScholarships);

// Get single scholarship
router.route("/get/:id").get(getASingleScholarship);

// Get latest scholarships
router.route("/latest").get(getLatestScholarships);

// Delete scholarship
router.delete("/:id", isAuthenticated, deleteScholarship);

// Update scholarship
router.put("/update/:id", isAuthenticated, updateScholarship);

export default router;
