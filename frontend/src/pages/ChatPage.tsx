import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { AppSidebar } from "@/components/common/AppSidebar";
import ChatInput from "@/components/chat/ChatInput";
import StreamWindow from "@/components/chat/StreamWindow";
import type { Message } from "@/components/chat/StreamWindow";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";

export default function ChatPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();

  const {
    activeConversationId,
    setActiveConversationId,
    addProvisionalConversation,
    fetchConversations,
    swapProvisionalId,
    setGeneratingTitleId,
  } = useConversations();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isChatActive = messages.length > 0 || loading;

  useEffect(() => {
    const abortController = new AbortController();

    if (conversationId) {
      setActiveConversationId(conversationId);

      const loadHistoryLog = async () => {
        try {
          const response = await fetch(
            `http://localhost:8080/conversations/${conversationId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: abortController.signal,
            },
          );
          if (response.ok) {
            const data = await response.json();
            setMessages(data.messages || []);
          } else {
            console.error("Conversation not found, falling back.");
            navigate("/chat", { replace: true });
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Failed loading chat history:", err);
          }
        }
      };

      loadHistoryLog();
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }

    return () => {
      abortController.abort();
    };
  }, [conversationId, setActiveConversationId, token, navigate]);

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
          headers: { Authorization: `Bearer ${token}` },
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

    const isNewChat = !activeConversationId;
    const tempId = `optimistic_${Date.now()}`;
    const provisionalTitle = userMessage.substring(0, 25) + "...";

    if (isNewChat) {
      addProvisionalConversation(tempId, provisionalTitle);
      setGeneratingTitleId(tempId);
      setActiveConversationId(tempId);
    }

    try {
      const response = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: userMessage,
          conversation_id: isNewChat ? null : activeConversationId,
          client_context: {
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const returnedConvId = response.headers.get("X-Conversation-Id");

      if (isNewChat && returnedConvId) {
        swapProvisionalId(tempId, returnedConvId);
        navigate(`/chat/${returnedConvId}`, { replace: true });

        let attempts = 0;
        const maxAttempts = 8;
        const pollIntervalMs = 4000;

        const pollForTitle = setInterval(async () => {
          attempts++;

          try {
            const res = await fetch(
              `http://localhost:8080/conversations/${returnedConvId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            if (res.ok) {
              const chatDoc = await res.json();
              if (chatDoc && chatDoc.title && !chatDoc.title.endsWith("...")) {
                clearInterval(pollForTitle);
                setGeneratingTitleId(null);
                await fetchConversations();
                return;
              }
            }
          } catch (pollErr) {
            console.error("Error during title polling iteration:", pollErr);
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollForTitle);
            setGeneratingTitleId(null);
            await fetchConversations();
          }
        }, pollIntervalMs);
      }

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
      if (isNewChat) {
        setGeneratingTitleId(null);
        await fetchConversations();
      }
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
    <SidebarProvider className="h-screen w-full overflow-hidden bg-background font-dmsans">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full relative overflow-hidden bg-background">
        {!isChatActive ? (
          <main className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full overflow-hidden">
            <div className="flex flex-col items-center w-full max-w-3xl animate-in fade-in duration-700 space-y-6">
              {/* Decorative App Initial containing Bricolage Typography */}
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-sm border border-primary/20 shrink-0">
                <span className="text-primary text-2xl font-bricolage font-black italic leading-none">
                  R
                </span>
              </div>
              <div className="text-center mb-4 shrink-0">
                {/* Hero Greeting explicitly styled with Bricolage Grotesque */}
                <h2 className="text-2xl md:text-4xl font-bricolage font-black tracking-tight mb-2 text-foreground">
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
