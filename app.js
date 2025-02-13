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

// CORS configuration
const corsOptions = {
  origin: 'https://frontend-exameets.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Apply CORS specifically to API routes
const apiRouter = express.Router();
apiRouter.use(cors(corsOptions));

// Mount all API routes
apiRouter.use("/user", userRouter);
apiRouter.use("/job", jobRouter);
apiRouter.use("/govtjob", govtJobRouter);
apiRouter.use("/internship", internshipRouter);
apiRouter.use("/previousyear", previousYearRouter);
apiRouter.use("/exam", examRouter);
apiRouter.use("/admission", admissionRouter);
apiRouter.use("/team", teamRouter);
apiRouter.use("/scholarship", scholarshipRouter);
apiRouter.use("/email", emailVerificationRoutes);
apiRouter.use("/forgotpassword", forgotPasswordRouter);
apiRouter.use("/result", resultRouter);
apiRouter.use("/admitcard", admitCardRouter);
apiRouter.use("/preference", preferenceRouter);
apiRouter.use("/search", searchRoutes);

// Mount the API router under /api/v1
app.use("/api/v1", apiRouter);

connection();
app.use(errorMiddleware)
export default app;
