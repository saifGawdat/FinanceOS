import API from "./axios";

export const processAICommand = async (command, history = []) => {
  try {
    const response = await API.post("/ai/chat", { command, history });
    return response.data;
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
};

export const transcribeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await API.post("/ai/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.text;
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};
