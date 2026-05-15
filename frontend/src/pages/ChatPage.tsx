import { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/common/AppSidebar";
import ChatInput from "@/components/chat/ChatInput";
import StreamWindow from "@/components/chat/StreamWindow";
import type { Message } from "@/components/chat/StreamWindow";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const { token } = useAuth(); // Pull the JWT from our context

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >("6a06f40fa821637dd9a28070");

  const isChatActive = messages.length > 0 || loading;

  // Auto-scroll whenever messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    if (!activeConversationId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `http://localhost:8080/upload/${activeConversationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `📄 **Document Processed:** \`${data.filename}\`\n\nI have added this to my context. You can now ask me questions about it.`,
        },
      ]);
    } catch (err) {
      console.error("Upload error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ **Error:** Failed to upload document.",
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const rawText = JSON.parse(line.replace("data: ", ""));

              setMessages((prev) => {
                const updatedMessages = [...prev];
                const lastIndex = updatedMessages.length - 1;
                updatedMessages[lastIndex] = {
                  ...updatedMessages[lastIndex],
                  content: updatedMessages[lastIndex].content + rawText,
                };
                return updatedMessages;
              });
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Stream failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "### Connection Error\nFailed to reach the AI backend.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full relative overflow-hidden bg-background">
        {!isChatActive ? (
          <main className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full overflow-hidden">
            <div className="flex flex-col items-center w-full max-w-3xl animate-in fade-in duration-700 space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-sm border border-primary/20 shrink-0">
                <span className="text-primary text-2xl font-black italic leading-none">
                  R
                </span>
              </div>

              <div className="text-center mb-4 shrink-0">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-foreground">
                  How can I help you today?
                </h2>
              </div>

              <div className="w-full mt-4 shrink-0">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  loading={loading}
                  onUpload={handleFileUpload}
                  isUploading={isUploading}
                  activeConversationId={activeConversationId}
                />
              </div>
            </div>
          </main>
        ) : (
          <main className="flex-1 w-full flex flex-col relative items-center overflow-hidden">
            <div className="flex-1 w-full overflow-y-auto px-4 pt-8 pb-32">
              <div className="max-w-3xl mx-auto">
                {/* Pass the messages array to the StreamWindow */}
                <StreamWindow messages={messages} scrollRef={scrollRef} />
              </div>
            </div>
            <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 pb-8 z-10 pointer-events-none">
              <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  loading={loading}
                  onUpload={handleFileUpload}
                  isUploading={isUploading}
                  activeConversationId={activeConversationId}
                />
              </div>
            </div>
          </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
