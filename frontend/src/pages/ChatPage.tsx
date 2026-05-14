import { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import ChatInput from "@/components/chat/ChatInput";
import StreamWindow from "@/components/chat/StreamWindow";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isChatActive = output.length > 0 || loading;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
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
        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            setOutput((prev) => prev + line.replace("data: ", ""));
          }
        }
      }
    } catch (err) {
      setOutput("### Connection Error\nFailed to connect to the backend.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full relative overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 bg-card z-10">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <div className="h-4 w-px bg-border mx-2" />
          <div className="text-xs font-bold bg-muted px-2 py-1 rounded uppercase tracking-wider text-foreground">
            Current Session
          </div>
        </header>

        {!isChatActive ? (
          /* EMPTY STATE */
          <main className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full overflow-hidden">
            <div className="flex flex-col items-center w-full max-w-3xl animate-in fade-in duration-700 space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm border border-primary/20 shrink-0">
                <span className="text-primary text-2xl font-black italic">
                  R
                </span>
              </div>

              <div className="text-center mb-4 shrink-0">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  How's the training going?
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Ask about hypertrophy protocols, nutrition, or input your
                  latest macro split for analysis.
                </p>
              </div>

              <div className="w-full mt-4 shrink-0">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  loading={loading}
                />
              </div>
            </div>
          </main>
        ) : (
          /* ACTIVE STATE */
          <main className="flex-1 w-full flex flex-col relative items-center overflow-hidden">
            <div className="flex-1 w-full overflow-y-auto px-4 pt-6 pb-48">
              <div className="max-w-3xl mx-auto">
                <StreamWindow output={output} scrollRef={scrollRef} />
              </div>
            </div>

            <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 pb-8 z-10 pointer-events-none">
              <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  loading={loading}
                />
              </div>
            </div>
          </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
