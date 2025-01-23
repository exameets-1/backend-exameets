import express from "express";

import {
    getAllScholarships,
    getASingleScholarship,
    getLatestScholarships
} from "../controllers/scholarshipController.js";

const router = express.Router();

router.route("/getall").get(getAllScholarships);
router.route("/get/:id").get(getASingleScholarship);
router.route("/latest").get(getLatestScholarships);

/*router.route("/new").post(isAuthenticatedUser, authorizeRoles("admin"), createScholarship);
router.route("/update/:id").put(isAuthenticatedUser, authorizeRoles("admin"), updateScholarship);
router.route("/delete/:id").delete(isAuthenticatedUser, authorizeRoles("admin"), deleteScholarship);*/

export default router;
