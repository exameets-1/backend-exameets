import express from "express";
import {
    getAllAdmitCards,
    getSingleAdmitCard,
    getLatestAdmitCards
} from "../controllers/admitCardController.js";


const router = express.Router();

// Public routes
router.get("/getall", getAllAdmitCards);
router.get("/get/:id", getSingleAdmitCard);
router.get("/latest", getLatestAdmitCards);

export default router;