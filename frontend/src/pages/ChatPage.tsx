import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { AppSidebar } from "@/components/common/AppSidebar";
import ChatInput from "@/components/chat/ChatInput";
import StreamWindow from "@/components/chat/StreamWindow";
import type { Message } from "@/components/chat/StreamWindow";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";

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
    updateConversationTitle,
    generatingTitleId,
  } = useConversations();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // NEW: State to hold the currently selected model
  const [selectedModel, setSelectedModel] = useState("gemma-4-26b-a4b-it");

  const isChatActive = !!conversationId || messages.length > 0 || loading;

  useEffect(() => {
    const abortController = new AbortController();

    if (conversationId) {
      setActiveConversationId(conversationId);

      if (conversationId === generatingTitleId) {
        console.log("Bypassing background fetch to prevent UI flicker.");
        return;
      }

      setMessages([]);

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
  }, [
    conversationId,
    setActiveConversationId,
    token,
    navigate,
    generatingTitleId,
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    const isNewChat = !activeConversationId;
    const targetId = isNewChat
      ? `optimistic_upload_${Date.now()}`
      : activeConversationId;

    if (isNewChat) {
      addProvisionalConversation(
        targetId,
        `Doc: ${file.name.substring(0, 20)}`,
      );
      setActiveConversationId(targetId);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`http://localhost:8080/upload/${targetId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      if (isNewChat && data.conversation_id) {
        swapProvisionalId(targetId, data.conversation_id);
        navigate(`/chat/${data.conversation_id}`, { replace: true });
        await fetchConversations();
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `📄 **Document Processed:** \`${data.filename}\`\n\nI have added this to my context. You can now ask me questions about it.`,
        },
      ]);
    } catch (err) {
      console.error("Upload error:", err);
      if (isNewChat) {
        setActiveConversationId(null);
        navigate("/chat", { replace: true });
      }
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeConversationId) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "" },
    ]);

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
          model: selectedModel, // NEW: Forward the selected model to the backend
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
        setGeneratingTitleId(returnedConvId);

        if (activeConversationId !== returnedConvId) {
          navigate(`/chat/${returnedConvId}`, { replace: true });
        }

        let attempts = 0;
        const maxAttempts = 12; // 36 seconds max wait time
        const pollIntervalMs = 3000;

        const pollForTitle = setInterval(async () => {
          attempts++;

          try {
            const res = await fetch(
              `http://localhost:8080/conversations/${returnedConvId}?t=${Date.now()}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Cache-Control": "no-cache",
                },
                cache: "no-store",
              },
            );

            if (res.status === 404) {
              return;
            }

            if (!res.ok) return;

            const chatDoc = await res.json();

            const isFinishedGenerating =
              chatDoc?.title &&
              chatDoc.title !== provisionalTitle &&
              !chatDoc.title.endsWith("...") &&
              chatDoc.title.length > 5;

            if (isFinishedGenerating) {
              clearInterval(pollForTitle);
              updateConversationTitle(returnedConvId, chatDoc.title);
              setGeneratingTitleId(null);
              return;
            }
          } catch (pollErr) {
            console.error("[POLLER ERROR]:", pollErr);
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollForTitle);
            setGeneratingTitleId(null);
            updateConversationTitle(returnedConvId, "Untitled Chat");
          }
        }, pollIntervalMs);
      }

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
                if (prev.length === 0) {
                  return [
                    { role: "user", content: userMessage },
                    { role: "assistant", content: rawText },
                  ];
                }

                const updatedMessages = [...prev];
                const lastIndex = updatedMessages.length - 1;

                if (!updatedMessages[lastIndex]) return prev;

                updatedMessages[lastIndex] = {
                  ...updatedMessages[lastIndex],
                  content: (updatedMessages[lastIndex].content || "") + rawText,
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

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "### Connection Error\nFailed to reach the AI backend.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider className="h-screen w-full overflow-hidden font-dmsans">
      <AppSidebar />
      <SidebarInset
        className="flex flex-col h-full relative overflow-hidden bg-background"
        onDragEnter={handleDragEnter}
      >
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary/50 m-4 rounded-3xl"
            >
              <div className="flex flex-col items-center justify-center pointer-events-none space-y-4">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bricolage font-bold text-foreground">
                  Drop document to upload
                </h2>
                <p className="text-muted-foreground font-dmsans">
                  Upload PDF, DOCX, or TXT directly into context
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!isChatActive ? (
          <main className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full overflow-hidden">
            <div className="flex flex-col items-center w-full max-w-3xl space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-sm border border-primary/20 shrink-0"
              >
                <span className="text-primary text-2xl font-bricolage font-black italic leading-none">
                  R
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="text-center mb-4 shrink-0"
              >
                <h2 className="text-2xl md:text-4xl font-bricolage font-black tracking-tight mb-2 text-foreground">
                  How can I help you today?
                </h2>
              </motion.div>

              <motion.div
                layoutId="chat-console-wrapper"
                layout="position"
                className="relative w-full mt-4 shrink-0 z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
              >
                <motion.div
                  layoutId="chat-console-glow"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[250px] bg-primary/20 blur-[100px] rounded-[100%] pointer-events-none -z-10"
                />

                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  loading={loading}
                  onUpload={handleFileUpload}
                  isUploading={isUploading}
                  activeConversationId={activeConversationId}
                  selectedModel={selectedModel} // NEW: Pass state to input
                  setSelectedModel={setSelectedModel} // NEW: Pass setter to input
                />
              </motion.div>
            </div>
          </main>
        ) : (
          <main className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
            <div className="flex-1 w-full overflow-y-auto px-4 pt-8">
              <div className="max-w-3xl mx-auto pb-4">
                <StreamWindow messages={messages} scrollRef={scrollRef} />
              </div>
            </div>

            <div className="w-full shrink-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-10 pointer-events-none">
              <motion.div
                layoutId="chat-console-wrapper"
                layout="position"
                className="relative max-w-3xl mx-auto w-full pointer-events-auto z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
              >
                <motion.div
                  layoutId="chat-console-glow"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150px] bg-primary/10 blur-[80px] rounded-[100%] pointer-events-none -z-10"
                />

                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  loading={loading}
                  onUpload={handleFileUpload}
                  isUploading={isUploading}
                  activeConversationId={activeConversationId}
                  selectedModel={selectedModel} 
                  setSelectedModel={setSelectedModel} 
                />
              </motion.div>
            </div>
          </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}