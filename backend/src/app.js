import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

import interviewRoutes from "./routes/interview.routes.js";
import authRoutes from "./routes/auth.routes.js";

import { authLimiter, globalLimiter } from "./middleware/rateLimit.js";

const app = express();

//securtiy middleware
app.use(helmet()); // security headers


//logging middleware
app.use(morgan("dev")); // request logs


app.use(
  cors({
    
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Required for cookies to be sent cross-origin
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//rate limitting
// general protection
app.use(globalLimiter); 
// only for auth routes
app.use("/api/auth", authLimiter); 


// routes
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);

//health check
app.get("/", (req, res) => {
  res.status(200).send("API is running");
});

//error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;