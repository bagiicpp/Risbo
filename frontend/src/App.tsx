import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setOutput("");

    try {
      const response = await fetch("http://localhost:8000/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        lines.forEach((line) => {
          if (line.startsWith("data: ")) {
            const content = line.replace("data: ", "");
            setOutput((prev) => prev + content);
          }
        });
      }
    } catch (error) {
      console.error("Stream Error:", error);
      setOutput(
        "### Connection Error\nCould not reach the Risbo backend. Ensure FastAPI is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-black selection:text-white">
      {/* Navigation / Header */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black tracking-tighter uppercase italic">
            Risbo <span className="text-zinc-500">v1.0</span>
          </h1>
          <div className="text-xs font-bold bg-zinc-100 px-2 py-1 rounded uppercase">
            Athlete Specialization
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 pb-32">
        {/* Chat History Container */}
        <div className="space-y-6">
          {!output && !loading && (
            <div className="py-20 text-center">
              <h2 className="text-4xl font-bold tracking-tight mb-2">
                How's the training going?
              </h2>
              <p className="text-zinc-500">
                Ask about hypertrophy, nutrition, or recovery protocols.
              </p>
            </div>
          )}

          {output && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-500">
              <article className="prose prose-zinc prose-pre:bg-zinc-900 prose-pre:text-zinc-100 max-w-none">
                <ReactMarkdown>{output}</ReactMarkdown>
              </article>
              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Message Risbo..."
              className="w-full p-4 pr-16 bg-white border-2 border-zinc-200 rounded-2xl shadow-xl outline-none focus:border-black transition-all placeholder:text-zinc-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all"
            >
              {loading ? (
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              ) : (
                "↑"
              )}
            </button>
          </div>
          <p className="text-[10px] text-center text-zinc-400 mt-2 uppercase tracking-widest font-bold">
            Built for FERI University Maribor • Powered by Gemma
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
