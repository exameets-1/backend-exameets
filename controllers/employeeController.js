import { Employee } from "../models/employeeSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

// 1. Create Employee
export const createEmployee = catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      empId,
      name,
      photoUrl,
      role,
      department,
      email,
      phone,
      linkedin,
      github,
      active
    } = req.body;

    const employee = await Employee.create({
      empId,
      name,
      photoUrl,
      role,
      department,
      email,
      phone,
      linkedin,
      github,
      active: active !== undefined ? active : true
    });

    res.status(200).json({
      success: true,
      message: "Employee created successfully",
      employee
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// 2. Get All Employees
export const getAllEmployees = catchAsyncErrors(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const skip = (page - 1) * limit;

    let query = { active: true }; // default active employees
    if (req.query.status === "inactive") query = { active: false };
    if (req.query.status === "all") query = {};

    if (req.query.keyword) {
      query.$or = [
        { name: { $regex: req.query.keyword, $options: "i" } },
        { empId: { $regex: req.query.keyword, $options: "i" } },
        { email: { $regex: req.query.keyword, $options: "i" } }
      ];
    }

    const totalEmployees = await Employee.countDocuments(query);
    const employees = await Employee.find(query).skip(skip).limit(limit);

    const totalPages = Math.ceil(totalEmployees / limit);
    res.status(200).json({
      success: true,
      employees,
      currentPage: page,
      totalPages,
      totalEmployees,
      message: "Employees fetched successfully"
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// 3. Get Single Employee
export const getSingleEmployee = catchAsyncErrors(async (req, res, next) => {
  const { id, empId } = req.params;

  let employee;
  if (empId) {
    employee = await Employee.findOne({ empId: empId.toUpperCase() });
  } else {
    employee = await Employee.findById(id);
  }

  if (!employee) return next(new ErrorHandler("Employee Not Found", 404));

  res.status(200).json({
    success: true,
    employee
  });
});

// 4. Update Employee
export const updateEmployee = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const employee = await Employee.findById(id);

  if (!employee) return next(new ErrorHandler("Employee Not Found", 404));

  Object.assign(employee, req.body); // merge updates
  await employee.save();

  res.status(200).json({
    success: true,
    message: "Employee updated successfully",
    employee
  });
});

// 5. Delete Employee
export const deleteEmployee = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const employee = await Employee.findById(id);

  if (!employee) return next(new ErrorHandler("Employee Not Found", 404));

  await employee.deleteOne();

  res.status(200).json({
    success: true,
    message: "Employee deleted successfully"
  });
});

// 6. Optional: Verify Employee (for barcode scan)
export const verifyEmployee = catchAsyncErrors(async (req, res, next) => {
  const { empId } = req.params;
  const employee = await Employee.findOne({ empId: empId.toUpperCase() });

  if (!employee) return next(new ErrorHandler("Employee Not Found", 404));

  // Could log scan here if needed
  res.status(200).json({
    success: true,
    employee,
    message: "Employee verified successfully"
  });
});
