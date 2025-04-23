import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
    getAllAdmissions,
    getSingleAdmission,
    getLatestAdmissions,
    deleteAdmission,
    updateAdmission,
    createAdmission
} from "../controllers/admissionController.js";

const router = express.Router();

// Create new admission
router.post("/create", isAuthenticated, createAdmission);

// Get all admissions
router.get("/getall", getAllAdmissions);

// Get single admission
router.get("/get/:id", getSingleAdmission);

// Get latest admissions
router.get("/latest", getLatestAdmissions);

// Delete admission
router.delete("/delete/:id", isAuthenticated, deleteAdmission);

// Update admission
router.put("/update/:id", isAuthenticated, updateAdmission);

export default router;
