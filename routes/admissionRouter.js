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
router.route("/getall").get(getAllAdmissions);

// Get single admission
router.route("/get/:id").get(getSingleAdmission);

// Get latest admissions
router.route("/latest").get(getLatestAdmissions);

// Delete admission
router.delete("/:id", isAuthenticated, deleteAdmission);

// Update admission
router.put("/update/:id", isAuthenticated, updateAdmission);

export default router;
