import express from "express";
import { 
    getAllInternships, 
    getASingleInternship,
    getLatestInternships
} from "../controllers/internshipController.js"

const router = express.Router();

router.get("/getall", getAllInternships);
router.get("/get/:id", getASingleInternship);
router.get("/latest", getLatestInternships);

export default router;