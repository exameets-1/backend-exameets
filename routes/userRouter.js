import express from "express";
import { getMyProfile, login, logout, register, updatePassword, updateProfile, deleteAccount } from "../controllers/userController.js"
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/getuser", isAuthenticated, getMyProfile);
router.put("/update/profile", isAuthenticated, updateProfile);
router.put("/update/password", isAuthenticated, updatePassword);
router.delete("/delete", isAuthenticated, deleteAccount);

export default router;