import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 10, // limit each IP to 5 requests per window
  message: {
    success: false,
    message: "Too many login attempts. Try again after 2 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const globalLimiter = rateLimit({
  windowMs: 1* 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    message: "Too many requests, slow down.",
  },
});