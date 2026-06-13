import express from "express";
import { signup, login, logout, getMe, } from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup",authLimiter, signup);
router.post("/login",authLimiter, login);
router.post("/logout", logout);
router.get("/me",  protect, getMe);

export default router;