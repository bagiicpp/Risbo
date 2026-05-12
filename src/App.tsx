import React, { useState } from "react";
import axios from "axios";

interface ChatResponse {
  response: string;
}

function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTestChat = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post<ChatResponse>(
        "http://localhost:8000/test-chat",
        {
          prompt: input,
        },
      );
      setOutput(data.response);
    } catch (error) {
      console.error("Error calling local API:", error);
      setOutput("Failed to connect to local server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-mono">
      <div className="max-w-2xl mx-auto bg-white border border-gray-300 rounded-lg p-6">
        <h1 className="text-xl font-bold mb-4 uppercase tracking-wider">
          Ollama Test
        </h1>

        <input
          className="w-full p-2 border border-gray-400 rounded-md mb-4 outline-none focus:border-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />

        <button
          onClick={handleTestChat}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Send Prompt"}
        </button>

        {output && (
          <div className="mt-6 p-4 bg-gray-50 border-l-4 border-black">
            <p className="whitespace-pre-wrap">{output}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
