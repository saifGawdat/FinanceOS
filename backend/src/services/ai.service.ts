import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import fs from "fs";

export class AIService {
  private genAIClients: GoogleGenerativeAI[];
  private genAIIndex: number = 0;
  private groq: Groq;

  constructor() {
    // Collect all Gemini API keys
    const geminiApiKeys = Object.entries(process.env)
      .filter(
        ([key]) =>
          key.startsWith("GEMINI_API_KEY") ||
          key.startsWith("VITE_GEMINI_API_KEY"),
      )
      .map(([, v]) => v)
      .filter((v): v is string => !!v);

    const groqApiKey = process.env.GROQ_API || process.env.GROQ_API_KEY;

    if (!geminiApiKeys.length) {
      throw new Error("Missing GEMINI_API_KEY / VITE_GEMINI_API_KEY in env");
    }
    if (!groqApiKey) {
      throw new Error("Missing GROQ_API / GROQ_API_KEY in env");
    }

    this.genAIClients = geminiApiKeys.map((key) => new GoogleGenerativeAI(key));
    this.groq = new Groq({ apiKey: groqApiKey });
  }

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
CRITICAL: ALWAYS respond in English.

You can:
1) Navigate pages: dashboard, income, expense, employees, salaries, profit-summary, customers, settings.
2) Add transactions (income/expense).

Category Picking:
${categoriesList}

Rules:
- If user wants an action, use the tools provided.
- If missing required fields (amount/title/type/category), ask a question.
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
                    "Page name: dashboard, income, expense, employees, salaries, profit-summary, customers, settings",
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
                type: { type: "STRING", description: "income or expense" },
                title: { type: "STRING", description: "Short title" },
                amount: { type: "NUMBER", description: "Amount" },
                category: { type: "STRING", description: "Category" },
                date: {
                  type: "STRING",
                  description: "Date in YYYY-MM-DD format (optional)",
                },
                description: {
                  type: "STRING",
                  description: "Optional details",
                },
              },
              required: ["type", "title", "amount", "category"],
            },
          },
        ],
      },
      
    ];
  }

  private getGroqTools() {
    return [
      {
        type: "function" as const,
        function: {
          name: "navigate",
          description: "Navigate to a specific page in the application",
          parameters: {
            type: "object",
            properties: {
              page: {
                type: "string",
                description:
                  "Page name: dashboard, income, expense, employees, salaries, profit-summary, customers, settings",
              },
            },
            required: ["page"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "add_transaction",
          description: "Add a new financial transaction (income or expense)",
          parameters: {
            type: "object",
            properties: {
              type: { type: "string", description: "income or expense" },
              title: { type: "string", description: "Short title" },
              amount: { type: "number", description: "Amount" },
              category: { type: "string", description: "Category" },
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format",
              },
              description: { type: "string", description: "Optional details" },
            },
            required: ["type", "title", "amount", "category"],
          },
        },
      },
    ];
  }

  async processChat(
    command: string,
    history: any[] = [],
    categories: string[] = [],
  ) {
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`AIService: Trying model ${modelName}...`);
        const genAI = this.getNextGenAI();
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: this.getSystemPrompt(categories),
          tools: this.getTools() as any,
          toolConfig: {
            functionCallingConfig: { mode: "AUTO" },
          } as any,
        });

        // Format history for Gemini
        console.log(
          "AIService: Formatting history, input length:",
          history?.length,
        );
        // Manual history construction to ensure strict compliance
        const contents: any[] = [];
        let currentRole = "user"; // Start expecting a user message
        let currentParts: any[] = [];

        for (const item of history || []) {
          const role =
            item.role === "assistant" || item.role === "model"
              ? "model"
              : "user";

          const itemParts: any[] = [];
          if (item.parts && Array.isArray(item.parts)) {
            itemParts.push(
              ...item.parts
                .map((p: any) => {
                  if (p.text) return { text: p.text };
                  if (p.functionCall) return { functionCall: p.functionCall };
                  if (p.functionResponse)
                    return {
                      functionResponse: {
                        name: p.functionResponse.name,
                        response: p.functionResponse.response,
                      },
                    };
                  return null;
                })
                .filter(Boolean),
            );
          } else {
            const text =
              item.text ||
              item.content ||
              (typeof item.parts === "string" ? item.parts : "");
            if (text) itemParts.push({ text });
          }

          if (itemParts.length === 0) continue;

          if (role === currentRole) {
            currentParts.push(...itemParts);
          } else {
            if (currentParts.length > 0) {
              contents.push({ role: currentRole, parts: currentParts });
            }
            currentRole = role;
            currentParts = [...itemParts];
          }
        }

        // Push the last accumulated parts
        if (currentParts.length > 0) {
          contents.push({ role: currentRole, parts: currentParts });
        }

        // Add the new command
        if (
          contents.length > 0 &&
          contents[contents.length - 1].role === "user"
        ) {
          contents[contents.length - 1].parts.push({ text: command });
        } else {
          contents.push({ role: "user", parts: [{ text: command }] });
        }

        const result = await model.generateContent({ contents });
        const response = await result.response;

        // Check for function calls
        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const functionCallPart = parts.find((p: any) => p.functionCall);

        if (functionCallPart?.functionCall) {
          const { name, args } = functionCallPart.functionCall;
          return {
            type: "function_call",
            name,
            args,
          };
        }

        const text = response.text();
        return { type: "text", text };
      } catch (error: any) {
        console.error(
          `AIService: [${modelName}] Error encountered:`,
          error.message,
        );
        lastError = error;
        continue;
      }
    }

    // Fallback to Groq
    try {
      console.log("AIService: Falling back to Groq LLaMA...");
      const groqMessages: any[] = [
        { role: "system", content: this.getSystemPrompt(categories) },
        ...history.map((h) => {
          let content = h.text || h.content || "";
          if (!content && Array.isArray(h.parts)) {
            content = h.parts
              .map(
                (p: any) =>
                  p.text ||
                  JSON.stringify(p.functionCall || p.functionResponse || ""),
              )
              .join("\n");
          }
          return {
            role:
              h.role === "model" || h.role === "assistant"
                ? "assistant"
                : "user",
            content: content || "...", // Groq requires non-empty content
          };
        }),
        { role: "user", content: command },
      ];

      const completion = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        tools: this.getGroqTools(),
        tool_choice: "auto",
        max_tokens: 1024,
      });

      const choice = completion.choices[0];

      if (choice?.message?.tool_calls?.length) {
        const toolCall = choice.message.tool_calls[0];
        return {
          type: "function_call",
          name: toolCall.function.name,
          args: JSON.parse(toolCall.function.arguments || "{}"),
        };
      }

      const text = choice?.message?.content || "";
      if (!text) throw new Error("Empty response from Groq");

      return { type: "text", text };
    } catch (groqError: any) {
      console.error("Groq fallback failed:", groqError.message);
    }

    // Check if we are in a post-tool-execution context (function response present)
    // This prevents showing an error to the user if the action succeeded but the AI confirmation failed
    const isConfirmationRequest =
      history.some((h) => h.role === "function") ||
      command.includes("The action was successful.");

    if (isConfirmationRequest) {
      console.warn(
        "AI Service: Models failed during confirmation generation. Returning fallback success message.",
      );
      return {
        type: "text",
        text: "✅ Action completed successfully. (Note: The AI response service is temporarily unavailable, but your transaction was recorded.)",
      };
    }

    throw lastError || new Error("All AI models failed");
  }

  async transcribeAudio(filePath: string) {
    const transcription = await this.groq.audio.translations.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
      response_format: "json",
    });
    return transcription.text;
  }
}
