import express from "express";
import { 
    getAllResults, 
    getASingleResult,
    getLatestResults,
    deleteResult,
    updateResult,
    createResult,
    processResultDetails
} from "../controllers/resultController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();    

router.get("/getall", getAllResults);
router.get("/get/:id", getASingleResult);
router.get("/latest", getLatestResults);
router.delete("/:id", isAuthenticated, deleteResult);
router.put("/update/:id", isAuthenticated, updateResult);
router.post("/create", isAuthenticated, createResult);
router.post("/process", isAuthenticated, processResultDetails);

export default router;