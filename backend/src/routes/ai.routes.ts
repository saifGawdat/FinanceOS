import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import multer from "multer";
import path from "path";
import { auth } from "../middleware/auth.middleware";

const router = Router();

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${file.originalname}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({ storage });

// Routes
router.post("/chat", auth, aiController.chat);
router.post(
  "/transcribe",
  auth,
  upload.single("audio"),
  aiController.transcribe,
);

export default router;
