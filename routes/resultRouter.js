import express from "express";
import { 
    getAllResults, 
    getASingleResult,
    getLatestResults
} from "../controllers/resultController.js";

const router = express.Router();    

router.get("/getall", getAllResults);
router.get("/get/:id", getASingleResult);
router.get("/latest", getLatestResults);

export default router;