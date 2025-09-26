// routes/employeeRoutes.js
import express from "express";
import { 
    createEmployee,
    getAllEmployees,
    getSingleEmployee,
    updateEmployee,
    deleteEmployee,
    verifyEmployee
} from "../controllers/employeeController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// 1. Fetch all employees (supports pagination, keyword, status)
router.get("/getall", getAllEmployees);

// 2. Fetch single employee by Mongo _id
router.get("/get/:id", getSingleEmployee);

// 3. Fetch single employee by empId (for barcode verification)
router.get("/verify/:empId", verifyEmployee);

// 4. Create new employee (protected)
router.post("/new", isAuthenticated, createEmployee);

// 5. Update employee info (protected)
router.put("/update/:id", isAuthenticated, updateEmployee);

// 6. Delete employee (protected)
router.delete("/delete/:id", isAuthenticated, deleteEmployee);

export default router;
