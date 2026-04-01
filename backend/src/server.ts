import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/database";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
// Allow all origins (CORS: *)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);
app.use(express.json());

// Set COOP header for Google Auth
app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Request logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check route
app.get("/", (_req, res) => {
  res.json({ message: "Expense Tracker API is running" });
});

// Debug: Test API key
app.get("/api/debug/test-gemini", async (_req, res) => {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "VITE_GEMINI_API_KEY not set" });
    }
    
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Say 'API is working'");
    const text = result.response.text();
  
    app.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      next();
    });
    
    return res.json({ success: true, message: text });
  } catch (error: any) {
    console.error("Gemini API test error:", error);
    return res.status(500).json({
      error: error.message,
      details: error.errorDetails || error.response?.data,
    });
  }
});

// Routes
app.use("/api", routes);

// 404 Handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: "API Route not found",
    method: req.method,
    url: req.url,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
