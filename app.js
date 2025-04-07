import {config} from 'dotenv' 
config({path: "./config/config.env"});
import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import {connection} from "./database/connection.js"
import { errorMiddleware } from './middlewares/error.js'
import userRouter from "./routes/userRouter.js"
import jobRouter from "./routes/jobRouter.js"
import govtJobRouter from "./routes/govtJobRouter.js";
import internshipRouter from './routes/internshipRouter.js'
import previousYearRouter from "./routes/previousYearRouter.js"
import admissionRouter from "./routes/admissionRouter.js";
import teamRouter from "./routes/teamRouter.js";
import scholarshipRouter from "./routes/scholarshipRouter.js";
import emailVerificationRoutes from './routes/emailVerification.js'
import forgotPasswordRouter from './routes/forgotPasswordRoute.js'
import resultRouter from './routes/resultRouter.js'
import admitCardRouter from './routes/admitCardRouter.js'
import preferenceRouter from './routes/preferenceRouter.js'
import searchRoutes from './routes/searchRoutes.js';
import phoneVerificationRoutes from './routes/phoneVerificationRouter.js';
//import { newsLetterCron } from './automation/newsLetterCron.js';
const app = express()
// In your app.js, add this before your other routes
app.get("/", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    FRONTEND_URL: process.env.FRONTEND_URL
  });

});
 

// Apply CORS to all routes
app.use(cors({
  origin: [process.env.FRONTEND_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));


// Handle preflight requests


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));


// Mount all API routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/govtjob", govtJobRouter);
app.use("/api/v1/internship", internshipRouter);
app.use("/api/v1/pyqs", previousYearRouter);
app.use("/api/v1/admission", admissionRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/scholarship", scholarshipRouter);
app.use("/api/v1/email", emailVerificationRoutes);
app.use("/api/v1/phone", phoneVerificationRoutes);
app.use("/api/v1/forgotpassword", forgotPasswordRouter);
app.use("/api/v1/result", resultRouter);
app.use("/api/v1/admitcard", admitCardRouter);
app.use("/api/v1/preference", preferenceRouter);
app.use("/api/v1/search", searchRoutes);

// Mount the API router under /api/v1

connection();
app.use(errorMiddleware)
export default app;
