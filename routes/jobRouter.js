import express from "express";
import { 
    getAllJobs, 
    getASingleJob,
    getLatestJobs,
    deleteJob,
    updateJob,
    createJob,
    getAllITJobs,
    getAllNonITJobs,
    processJobDetails
} from "../controllers/jobController.js";   
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.get("/getall", getAllJobs);
router.get("/get/:id", getASingleJob);
router.get("/latest", getLatestJobs);
router.delete("/:id", isAuthenticated, deleteJob);
router.put("/:id", isAuthenticated, updateJob);
router.post("/create", isAuthenticated, createJob);
router.get("/getall/it", getAllITJobs);
router.get("/getall/non-it", getAllNonITJobs);
router.post("/process", isAuthenticated, processJobDetails);

export default router;