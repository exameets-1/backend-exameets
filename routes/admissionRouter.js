import express from "express";
import {
    getAllAdmissions,
    getSingleAdmission,
    getLatestAdmissions,
    /*createAdmission,
    updateAdmission,
    deleteAdmission,*/
} from "../controllers/admissionController.js";

const router = express.Router();

// Basic CRUD routes
router.get("/getall", getAllAdmissions);
router.get("/get/:id", getSingleAdmission);
router.get("/latest", getLatestAdmissions);
/*
router.route("/create").post(createAdmission);
router.route("/update/:id").put(updateAdmission);
router.route("/delete/:id").delete(deleteAdmission);

// Additional utility routes
router.route("/institution/:institution").get(getAdmissionsByInstitution);
router.route("/upcoming").get(getUpcomingDeadlines);
router.route("/location/:state").get(getAdmissionsByLocation);
*/

export default router;
