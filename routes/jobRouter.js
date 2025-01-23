import express from "express";
import { 
    getAllJobs, 
    getASingleJob,
    getLatestJobs
} from "../controllers/jobController.js";
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.get("/getall", getAllJobs);
router.get("/get/:id", getASingleJob);
router.get("/latest", getLatestJobs);

export default router;