require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel() {
  // Try models as documented at https://ai.google.dev/gemini-api/docs/models/gemini
  const modelsToTest = [
    "gemini-2.0-flash-exp",
    "gemini-exp-1114",
    "gemini-1.5-flash",
    "models/gemini-1.5-flash",
    "models/gemini-pro",
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      console.log(`  ✓ SUCCESS!`);
      return;
    } catch (error) {
      const msg = error.message;
      if (msg.includes("404")) {
        console.log(`  ✗ Not found`);
      } else if (msg.includes("429") || msg.includes("quota")) {
        console.log(`  ✗ Quota exceeded`);
      } else if (msg.includes("401") || msg.includes("permission")) {
        console.log(`  ✗ Auth error`);
      } else {
        console.log(`  ✗ Error: ${msg.substring(0, 60)}`);
      }
    }
  }
  console.log("\nNo working models found!");
}

testModel();
