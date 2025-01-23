import express from "express";
import { 
    getAllTeams, 
    getASingleTeam,
} from "../controllers/teamController.js";

const router = express.Router();

router.get("/getall", getAllTeams);
router.get("/get/:id", getASingleTeam);

export default router;