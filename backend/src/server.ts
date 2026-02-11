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

// Request logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", routes);

// Health check route
app.get("/", (_req, res) => {
  res.json({ message: "Expense Tracker API is running" });
});

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
