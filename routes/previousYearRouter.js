import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
    getAllSubjects,
    getPapersBySubject,
    getPapersBySubjectAndYear,
    getLatestPapers,
    addPaper,
    updatePaper,
    deletePaper
} from "../controllers/previousYearController.js";

const router = express.Router();


// Get all previous year papers
router.get("/", getAllSubjects);

//GET latest papers
router.get("/latest", getLatestPapers);
// Get single previous year paper
router.get("/:subjectSlug", getPapersBySubject);

// Get papers of a subject for a specific year
router.get("/:subjectSlug/:year", getPapersBySubjectAndYear);

// Add a new paper
router.post("/add", isAuthenticated, addPaper);

// Update a paper
router.put("/:paperId", isAuthenticated, updatePaper);

// Delete a paper
router.delete("/:paperId", isAuthenticated, deletePaper);


export default router;