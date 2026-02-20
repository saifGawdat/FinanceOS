const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyDi5I4Usd41jIVAC5boKSWHqa_Lo6i2zH8";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent("Test");
    console.log("Success:", result.response.text());
  } catch (error) {
    console.log("Full error message:");
    console.log(error.message);
  }
}

testModel();
