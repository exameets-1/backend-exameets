import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
    getAllPreviousYears,
    getASinglePreviousYear,
    updatePreviousYear,
    deletePreviousYear,
    createPreviousYear,
    getLatestPreviousYears
} from "../controllers/previousYearController.js";

const router = express.Router();

// Create new previous year paper
router.post("/create", isAuthenticated, createPreviousYear);

// Get all previous year papers
router.get("/getall", getAllPreviousYears);

// Get single previous year paper
router.get("/get/:id", getASinglePreviousYear);

// Update previous year paper
router.put("/update/:id", isAuthenticated, updatePreviousYear);

// Delete previous year paper
router.delete("/:id", isAuthenticated, deletePreviousYear);

// Get latest previous year papers
router.get("/latest", getLatestPreviousYears);

export default router;