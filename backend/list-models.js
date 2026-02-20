const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyDi5I4Usd41jIVAC5boKSWHqa_Lo6i2zH8";
const genAI = new GoogleGenerativeAI(apiKey);

async function listAvailableModels() {
  try {
    console.log("Fetching available models...\n");
    const models = await genAI.listModels();
    
    console.log("Available models for generateContent:");
    let count = 0;
    for await (const model of models) {
      // Only show models that support generateContent
      if (model.supportedGenerationMethods && 
          model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`  - ${model.name}`);
        count++;
      }
    }
    console.log(`\nTotal models supporting generateContent: ${count}`);
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listAvailableModels();
