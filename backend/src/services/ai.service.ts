import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import fs from "fs";

export class AIService {
  private genAIClients: GoogleGenerativeAI[];
  private genAIIndex: number = 0;
  private groq: Groq;

  constructor() {
    // Collect all Gemini API keys that start with VITE_GEMINI_API_KEY*
    const geminiApiKeys = Object.entries(process.env)
      .filter(([key]) => key.startsWith("VITE_GEMINI_API_KEY"))
      .map(([, value]) => value)
      .filter((v): v is string => !!v);

    const groqApiKey = process.env.GROQ_API;

    if (geminiApiKeys.length === 0) {
      throw new Error("At least one VITE_GEMINI_API_KEY is required in .env");
    }
    if (!groqApiKey) {
      throw new Error("GROQ_API is not defined in .env");
    }

    // Initialize a client per key for simple round-robin load balancing
    this.genAIClients = geminiApiKeys.map(
      (key) => new GoogleGenerativeAI(key),
    );
    this.groq = new Groq({ apiKey: groqApiKey });
  }

  // Round-robin selection of Gemini client
  private getNextGenAI(): GoogleGenerativeAI {
    const client = this.genAIClients[this.genAIIndex];
    this.genAIIndex = (this.genAIIndex + 1) % this.genAIClients.length;
    return client;
  }

  private getSystemPrompt(categories: string[] = []) {
    const categoriesList =
      categories.length > 0
        ? `Existing categories: ${categories.join(", ")}`
        : "No categories defined yet.";

    return `You are a highly intelligent financial assistant for a Financial Management System. 
    Your goal is to help users manage their finances effectively. 
    
    CRITICAL: ALWAYS respond in English, regardless of the user's input language. 
    If you transcribe audio in a different language, process the meaning but respond in English.

    You can:
    1. Navigate the user to different pages: dashboard, income, expense, employees, salaries, profit-summary, customers, settings.
    2. Add transactions (income or expense).
    
    Category Picking:
    When adding a transaction, you MUST try to match the user's intent to one of the following existing categories if they are relevant:
    ${categoriesList}
    
    If none of the existing categories fit well, you can suggest a new appropriate one.

    Guidelines:
    - Be concise, professional, and helpful.
    - If you perform an action (like navigating or adding a transaction), confirm it clearly in English.
    - If the user's intent is unclear, ask for clarification in English.
    
    App Structure Context:
    - Dashboard: Overview of finances.
    - Income/Expense: Manage transactions.
    - Employees/Salaries: Manage staff and payroll.
    - Customers: Manage client information.
    - Profit-Summary: Detailed financial reports.
    `;
  }

  private getTools() {
    return [
      {
        functionDeclarations: [
          {
            name: "navigate",
            description: "Navigate to a specific page in the application",
            parameters: {
              type: "OBJECT",
              properties: {
                page: {
                  type: "STRING",
                  description:
                    "The name of the page to navigate to. Options: dashboard, income, expense, employees, salaries, profit-summary, customers, settings",
                },
              },
              required: ["page"],
            },
          },
          {
            name: "add_transaction",
            description: "Add a new financial transaction (income or expense)",
            parameters: {
              type: "OBJECT",
              properties: {
                type: {
                  type: "STRING",
                  description: "The type of transaction: 'income' or 'expense'",
                },
                title: {
                  type: "STRING",
                  description: "A short title for the transaction",
                },
                amount: {
                  type: "NUMBER",
                  description: "The amount of the transaction",
                },
                category: {
                  type: "STRING",
                  description:
                    "The category of the transaction. Prefer matching an existing category if possible.",
                },
                date: {
                  type: "STRING",
                  description:
                    "The date of the transaction in YYYY-MM-DD format.",
                },
                description: {
                  type: "STRING",
                  description:
                    "A longer description of the transaction (optional)",
                },
              },
              required: ["type", "title", "amount", "category"],
            },
          },
        ],
      },
    ];
  }

  async processChat(
    command: string,
    history: any[] = [],
    categories: string[] = [],
  ) {
    console.log("AIService: Processing command:", command);

    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-pro",
    ];

    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`AIService: Trying model ${modelName}...`);
        const model = this.getNextGenAI().getGenerativeModel({
          model: modelName,
          tools: this.getTools() as any,
          systemInstruction: this.getSystemPrompt(categories),
        });

        const formattedHistory: any[] = [];
        let expectedRole = "user";

        for (const item of history) {
          let role = item.role === "assistant" ? "model" : item.role;

          if (role !== expectedRole && role !== "function") {
            continue;
          }

          const parts = item.parts
            .map((p: any) => {
              if (p.text) return { text: p.text };
              if (p.functionCall) return { functionCall: p.functionCall };
              if (p.functionResponse)
                return { functionResponse: p.functionResponse };
              return { text: p.content || "" };
            })
            .filter(
              (p: any) => p.text !== "" || p.functionCall || p.functionResponse,
            );

          if (parts.length > 0) {
            formattedHistory.push({ role, parts });
            if (role === "user") expectedRole = "model";
            else if (role === "model") expectedRole = "user";
          }
        }

        const chat = model.startChat({
          history: formattedHistory,
        });

        const result = await chat.sendMessage(command);
        const response = await result.response;

        if (!response.candidates || response.candidates.length === 0) {
          throw new Error("No response candidates returned.");
        }

        const call = response.functionCalls()?.[0];

        console.log(`AIService: [${modelName}] Success!`);
        return {
          type: call ? "function_call" : "text",
          name: call?.name,
          args: call?.args,
          text: response.text(),
        };
      } catch (error: any) {
        lastError = error;
        const msg = error.message || "";
        console.error(`AIService: [${modelName}] Failed:`, msg);

        if (
          msg.includes("404") ||
          msg.includes("403") ||
          msg.includes("not found") ||
          msg.includes("429") ||
          msg.includes("quota")
        ) {
          continue;
        }

        continue;
      }
    }

    throw lastError || new Error("AI service is currently unavailable.");
  }

  async transcribeAudio(filePath: string) {
    try {
      // Use translations instead of transcriptions to always get English
      const transcription = await this.groq.audio.translations.create({
        file: fs.createReadStream(filePath),
        model: "whisper-large-v3",
        response_format: "json",
      });

      return transcription.text;
    } catch (error: any) {
      console.error("Groq Translation Error:", error);
      throw new Error("Failed to transcribe audio: " + error.message);
    }
  }
}
