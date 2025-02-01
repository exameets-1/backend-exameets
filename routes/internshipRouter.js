import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
    getAllInternships,
    getASingleInternship,
    getLatestInternships,
    deleteInternship,
    updateInternship,
    createInternship
} from "../controllers/internshipController.js";

const router = express.Router();

// Create Internship
router.post("/create", isAuthenticated, createInternship);

// Get All Internships
router.get("/getall", getAllInternships);

// Get Single Internship
router.get("/get/:id", getASingleInternship);

// Get Latest Internships
router.get("/latest", getLatestInternships);

// Delete Internship
router.delete("/delete/:id", isAuthenticated, deleteInternship);

// Update Internship
router.put("/update/:id", isAuthenticated, updateInternship);

export default router;