import { Request, Response, NextFunction } from "express";
import { AIService } from "../services/ai.service";
import { ExpenseCategoryService } from "../services/expense-category.service";
import fs from "fs";

const aiService = new AIService();
const expenseCategoryService = new ExpenseCategoryService();

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { command, history } = req.body;
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    // Pass user's categories to AI for smarter mapping
    const categories = await expenseCategoryService.getUniqueCategories(
      req.userId!,
    );

    const result = await aiService.processChat(
      command,
      history || [],
      categories,
    );
    return res.json(result);
  } catch (error: any) {
    console.error("Backend AI Chat Error:", error.message, error.stack);
    return next(error);
  }
};

export const transcribe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const text = await aiService.transcribeAudio(req.file.path);

    // Clean up uploaded file after transcription
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp audio file:", err);
    });

    return res.json({ text });
  } catch (error) {
    // Also clean up on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err)
          console.error("Error deleting temp audio file after error:", err);
      });
    }
    return next(error);
  }
};
