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
import examRouter from './routes/examRouter.js'
import admissionRouter from "./routes/admissionRouter.js";
import teamRouter from "./routes/teamRouter.js";
import scholarshipRouter from "./routes/scholarshipRouter.js";
import emailVerificationRoutes from './routes/emailVerification.js'
import forgotPasswordRouter from './routes/forgotPasswordRoute.js'
import resultRouter from './routes/resultRouter.js'
import admitCardRouter from './routes/admitCardRouter.js'
import preferenceRouter from './routes/preferenceRouter.js'
import searchRoutes from './routes/searchRoutes.js';
//import { newsLetterCron } from './automation/newsLetterCron.js';
const app = express()
// In your app.js, add this before your other routes
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
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
app.use("/user", userRouter);
app.use("/job", jobRouter);
app.use("/govtjob", govtJobRouter);
app.use("/internship", internshipRouter);
app.use("/previousyear", previousYearRouter);
app.use("/exam", examRouter);
app.use("/admission", admissionRouter);
app.use("/team", teamRouter);
app.use("/scholarship", scholarshipRouter);
app.use("/email", emailVerificationRoutes);
app.use("/forgotpassword", forgotPasswordRouter);
app.use("/result", resultRouter);
app.use("/admitcard", admitCardRouter);
app.use("/preference", preferenceRouter);
app.use("/search", searchRoutes);

// Mount the API router under /api/v1

connection();
app.use(errorMiddleware)
export default app;
