import React, { useState, useEffect, useRef } from "react";
import { IoSend, IoClose, IoChatbubbles, IoMic, IoStop } from "react-icons/io5";
import { processAICommand, transcribeAudio } from "../../api/geminiService";
import { useAIActions } from "../../hooks/useAIActions";

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your AI assistant. You can ask me to navigate or add transactions by typing your command here.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const { handleAction } = useAIActions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleAssistant = () => setIsOpen(!isOpen);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Map history for Gemini - ensures it starts with a 'user' message
      const history = messages
        .filter((m, i) => i > 0 || m.role === "user") // Skip the initial assistant greeting
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        }));

      const result = await processAICommand(text, history);

      if (result.type === "function_call") {
        const actionResult = await handleAction(result);

        // Add the system/tool result to messages (internally or visibly)
        // Then automatically ask Gemini for a final response based on the action result
        // Update history with the function call and result
        const updatedHistory = [
          ...history,
          { role: "user", parts: [{ text }] },
          {
            role: "model",
            parts: [
              {
                functionCall: {
                  name: result.name,
                  args: result.args,
                },
              },
            ],
          },
          {
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: result.name,
                  response: { name: result.name, content: actionResult },
                },
              },
            ],
          },
        ];

        // Ask Gemini for a final response based on the action result
        const finalResult = await processAICommand(
          "The action was successful. Please confirm this to the user.",
          updatedHistory,
        );
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: finalResult.text },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: result.text },
        ]);
      }
    } catch (error) {
      console.error("AI Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Sorry, I'm having trouble connecting: ${error.message}. Please check if the backend is running and your API keys are correct.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setIsLoading(true);
        try {
          const transcribedText = await transcribeAudio(audioBlob);
          if (transcribedText) {
            handleSend(transcribedText);
          }
        } catch (error) {
          console.error("Transcription failed:", error);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: "Sorry, I couldn't transcribe your voice. Please try typing.",
            },
          ]);
        } finally {
          setIsLoading(false);
        }

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I couldn't access your microphone. Please check browser permissions and try again.",
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleAssistant}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
        >
          <IoChatbubbles
            size={28}
            className="group-hover:rotate-12 transition-transform"
          />
        </button>
      )}

      {/* Assistant Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[550px] bg-[#09090c] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 slide-in-from-bottom-10">
          {/* Header */}
          <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold text-gray-100">AI Assistant</span>
            </div>
            <button
              onClick={toggleAssistant}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <IoClose size={24} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white/5 text-gray-200 border border-white/5 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/2 border-t border-white/5 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
                placeholder={isRecording ? "Listening..." : "Type a command..."}
                className={`flex-1 bg-white/5 border ${isRecording ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-blue-500/50 transition-all font-display`}
                disabled={isRecording}
              />
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title={isRecording ? "Stop Recording" : "Voice Command"}
              >
                {isRecording ? <IoStop size={20} /> : <IoMic size={20} />}
              </button>
              <button
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim() || isLoading || isRecording}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <IoSend size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
