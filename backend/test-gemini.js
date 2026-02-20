require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.VITE_GEMINI_API_KEY;
console.log("Testing Gemini API...");

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const modelsToTest = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      console.log(`  Created model instance...`);

      const result = await model.generateContent("Hello, what is 2+2?");
      console.log(`  ✓ SUCCESS! Response: ${result.response.text()}`);
    } catch (error) {
      console.error(`  ✗ FAILED: ${error.message}`);
    }
  }
}

testModels();
