import express from "express";
import {
    getAllAdmitCards,
    getSingleAdmitCard,
    getLatestAdmitCards,
    deleteAdmitCard,
    updateAdmitCard,
    createAdmitCard
} from "../controllers/admitCardController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.get("/getall", getAllAdmitCards);
router.get("/get/:id", getSingleAdmitCard);
router.get("/latest", getLatestAdmitCards);
router.delete("/:id",  isAuthenticated, deleteAdmitCard);
router.put("/update/:id", isAuthenticated, updateAdmitCard);
router.post("/create", isAuthenticated, createAdmitCard);

export default router;