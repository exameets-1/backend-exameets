import express from "express"
import {
    getAllPreviousYears,
    getASinglePreviousYear
} from "../controllers/previousYearController.js"

const router = express.Router();

router.get('/getall', getAllPreviousYears);
router.get('/get/:id', getASinglePreviousYear);

export default router;