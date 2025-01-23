import express from "express";
import { 
    getAllGovtJobs, 
    getASingleGovtJob,
    getLatestGovtJobs
} from "../controllers/govtJobController.js";

const router = express.Router();

router.get("/getall", getAllGovtJobs);
router.get("/get/:id", getASingleGovtJob);
router.get("/latest", getLatestGovtJobs);

export default router;
