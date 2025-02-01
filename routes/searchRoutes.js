import express from "express";
import { searchAcrossCollections } from "../controllers/globalSearchController.js";
const router = express.Router();

router.get('/', searchAcrossCollections);

export default router;
