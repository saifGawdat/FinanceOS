const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "[ENCRYPTION_KEY]";
console.log("Testing Gemini API models...\n");

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const modelsToTest = ["gemini-1.0-pro", "gemini-1.5-pro-latest"];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("What is 2+2?");
      const response = result.response;
      if (response.text) {
        console.log(`  ✓ SUCCESS: ${response.text().substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(`  ✗ FAILED: ${error.message.substring(0, 100)}...`);
    }
  }
}

testModels();
