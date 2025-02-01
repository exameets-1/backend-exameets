import express from "express";
import { 
    getAllGovtJobs, 
    getASingleGovtJob,
    getLatestGovtJobs,
    deleteGovtJob,
    updateGovtJob,
    createGovtJob
} from "../controllers/govtJobController.js";
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.get("/getall", getAllGovtJobs);
router.get("/get/:id", getASingleGovtJob);
router.get("/latest", getLatestGovtJobs);
router.delete("/:id", isAuthenticated, deleteGovtJob);
router.put("/update/:id", isAuthenticated, updateGovtJob);
router.post("/create", isAuthenticated, createGovtJob);

export default router;
