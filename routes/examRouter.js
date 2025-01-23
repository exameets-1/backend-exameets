import express from "express";
import {
    getAllExams,
    getSingleExam,
} from "../controllers/examController.js";

const router = express.Router();

router.route("/getall").get(getAllExams);
router.route("/get/:id").get(getSingleExam);


export default router;