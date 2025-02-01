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
app.use(cors({
  origin: ['https://frontend-exameets.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({extended:true}));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);

app.use("/api/v1/govtjob", govtJobRouter);
app.use("/api/v1/internship", internshipRouter);
app.use("/api/v1/previousyear", previousYearRouter);
app.use("/api/v1/exam", examRouter);
app.use("/api/v1/admission", admissionRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/scholarship", scholarshipRouter);
app.use("/api/v1/email", emailVerificationRoutes);
app.use("/api/v1/password", forgotPasswordRouter);
app.use('/api/v1/result', resultRouter);
app.use('/api/v1/admitcard', admitCardRouter)
app.use('/api/v1/preferences', preferenceRouter)   
app.use('/api/v1/search', searchRoutes);

//newsLetterCron()
connection();
app.use(errorMiddleware)
export default app;
