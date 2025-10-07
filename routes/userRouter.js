import express from "express";
import { getMyProfile, login, logout, register, updatePassword, updateProfile, deleteAccount, checkEmailExists, checkPhoneExists, getMatchedJobs, getAllAdmins } from "../controllers/userController.js"
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/getuser", isAuthenticated, getMyProfile);
router.put("/update/profile", isAuthenticated, updateProfile);
router.put("/update/password", isAuthenticated, updatePassword);
router.get("/matchedjobs", isAuthenticated, getMatchedJobs);
router.delete("/delete", isAuthenticated, deleteAccount);
router.post("/check-email", checkEmailExists);
router.post("/check-phone", checkPhoneExists);
router.get("/admins", isAuthenticated, getAllAdmins);

export default router;