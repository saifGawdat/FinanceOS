import { Request, Response, NextFunction } from "express";
import { AIService } from "../services/ai.service";
import { ExpenseCategoryService } from "../services/expense-category.service";
import fs from "fs";

let aiService: AIService | null = null;

function getAIService() {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
}

export const chat = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    const { command, history } = req.body;
    console.log("\n=== AI CHAT REQUEST START ===");
    console.dir(req.body, { depth: null, colors: true });
    console.log("Command:", command);
    console.log("UserId:", req.userId);
    console.log("History length:", history?.length || 0);

    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    console.log("Step 1: Getting AI Service...");
    const aiService = getAIService();
    console.log("Step 2: AI Service obtained");

    console.log("Step 3: Creating ExpenseCategoryService...");
    let expenseCategoryService: any;
    try {
      expenseCategoryService = new ExpenseCategoryService();
      console.log("Step 4: ExpenseCategoryService created");
    } catch (serviceError: any) {
      console.error(
        "ERROR creating ExpenseCategoryService:",
        serviceError.message,
      );
      throw serviceError;
    }

    console.log("Step 5: Fetching categories for user:", req.userId);
    const categories = await expenseCategoryService.getUniqueCategories(
      req.userId!,
    );
    console.log("Step 6: Categories fetched:", categories.length, "categories");
    console.log("Categories:", categories);

    console.log("Step 7: Calling aiService.processChat");
    const result = await aiService.processChat(
      command,
      history || [],
      categories,
    );
    console.log("Step 8: AI Response generated successfully");
    console.log("Response type:", result.type);
    console.log("=== AI CHAT REQUEST END (SUCCESS) ===\n");
    return res.json(result);
  } catch (error: any) {
    console.error("\n!!! AI CHAT ERROR !!!");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    console.error("=== AI CHAT REQUEST END (ERROR) ===\n");
    return res.status(500).json({
      error: "AI Service Error",
      message: error.message,
      stack: error.stack,
    });
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

    const aiService = getAIService();
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
