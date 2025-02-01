import express from "express";
import { 
    getAllTeams, 
    getASingleTeam,
    deleteTeam
} from "../controllers/teamController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", getAllTeams);
router.get("/get/:id", getASingleTeam);
router.delete("/:id",  isAuthenticated, deleteTeam);

export default router;