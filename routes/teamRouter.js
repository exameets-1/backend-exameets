import express from "express";
import { 
    getAllTeams, 
    getASingleTeam,
    deleteTeam,
    createTeam,
    approveTeam
} from "../controllers/teamController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", getAllTeams);
router.get("/get/:id", getASingleTeam);
router.delete("/:id", isAuthenticated, deleteTeam);
router.post("/new", isAuthenticated, createTeam);
router.patch("/approve/:id", isAuthenticated, approveTeam);

export default router;