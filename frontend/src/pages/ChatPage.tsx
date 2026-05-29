import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
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
  const { token, user, isAuthenticated } = useAuth();
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
  } = useConversations();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);
  const isProgrammaticScroll = useRef(false);

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("gemma-4-26b-a4b-it");
  const [enableSearch, setEnableSearch] = useState(false);

  const isChatActive = !!conversationId || messages.length > 0 || loading;

  useEffect(() => {
    const abortController = new AbortController();

    if (conversationId) {
      setMessages([]);
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
  }, [conversationId]);

  const handleScroll = () => {
    // If the system is currently forcing a scroll, ignore the event
    // so we don't accidentally trip the unlock logic.
    if (!scrollContainerRef.current || isProgrammaticScroll.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    const distanceFromBottom = Math.abs(
      scrollHeight - scrollTop - clientHeight,
    );

    isAutoScrollEnabled.current = distanceFromBottom <= 150;
  };

  useEffect(() => {
    if (isAutoScrollEnabled.current && scrollRef.current) {
      isProgrammaticScroll.current = true;

      scrollRef.current.scrollIntoView({ behavior: "smooth" });

      requestAnimationFrame(() => {
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 50);
      });
    }
  }, [messages]);

  const handleFileUpload = (file: File) => {
    setStagedFile(file);
  };

  const clearStagedFile = () => {
    setStagedFile(null);
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
    if ((!input.trim() && !stagedFile) || loading) return;

    isAutoScrollEnabled.current = true;

    let finalUserMessage = input.trim();
    const displayMessage = stagedFile
      ? `[FILE: ${stagedFile.name}]\n${input.trim()}`
      : input.trim();

    setLoading(true);

    // --- PHASE 1: PRE-PROCESS STAGED FILE ---
    if (stagedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", stagedFile);

      try {
        const extractRes = await fetch("http://localhost:8080/extract-text", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!extractRes.ok)
          throw new Error("Failed to extract text from document");
        const extractData = await extractRes.json();

        // Bundle the extracted text invisibly into the payload sent to the LLM
        finalUserMessage = `[ATTACHED DOCUMENT: ${stagedFile.name}]\n${extractData.text}\n\n${finalUserMessage}`;
      } catch (err) {
        console.error("Document processing failed:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ **Error:** Failed to process the attached document.",
          },
        ]);
        setLoading(false);
        setIsUploading(false);
        return; // Abort send entirely if extraction fails
      } finally {
        setIsUploading(false);
        setStagedFile(null); // Clear the staging area
      }
    }

    // --- PHASE 2: OPTIMISTIC UI UPDATE ---
    // Use the clean displayMessage here, not the massive finalUserMessage
    setMessages((prev) => [
      ...prev,
      { role: "user", content: displayMessage },
      { role: "assistant", content: "" },
    ]);

    setInput("");

    const isNewChat = !activeConversationId;
    const tempId = `optimistic_${Date.now()}`;
    const provisionalTitle = displayMessage.substring(0, 25) + "...";

    if (isNewChat && isAuthenticated) {
      addProvisionalConversation(tempId, provisionalTitle);
      setGeneratingTitleId(tempId);
      setActiveConversationId(tempId);
    }

    // --- PHASE 3: SEND TO LLM ---
    try {
      const response = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: finalUserMessage,
          conversation_id: isNewChat ? null : activeConversationId,
          model: selectedModel,
          enable_search: enableSearch,
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
      const targetConvId = returnedConvId || activeConversationId;

      if (isNewChat && returnedConvId && isAuthenticated) {
        swapProvisionalId(tempId, returnedConvId);
        setActiveConversationId(returnedConvId);
        window.history.replaceState(null, "", `/chat/${returnedConvId}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const rawData = JSON.parse(line.replace("data: ", ""));

              if (rawData && rawData._type === "title_update") {
                if (targetConvId && isAuthenticated) {
                  updateConversationTitle(targetConvId, rawData.title);
                }
                setGeneratingTitleId(null);
                continue;
              }

              accumulatedContent += rawData;

              setMessages((prev) => {
                if (prev.length === 0) {
                  return [
                    { role: "user", content: displayMessage },
                    { role: "assistant", content: rawData },
                  ];
                }

                const updatedMessages = [...prev];
                const lastIndex = updatedMessages.length - 1;

                if (!updatedMessages[lastIndex]) return prev;

                updatedMessages[lastIndex] = {
                  ...updatedMessages[lastIndex],
                  content: (updatedMessages[lastIndex].content || "") + rawData,
                };
                return updatedMessages;
              });
            } catch (e) {}
          }
        }
      }

      // --- AUTO-RETRY on [NEEDS_WEB_SEARCH] marker ---
      // Only trigger if the user didn't already have search enabled (avoid infinite loop).
      if (!enableSearch && accumulatedContent.includes("[NEEDS_WEB_SEARCH]")) {
        // 1. Strip the marker from the displayed message
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content:
                last.content.replace("[NEEDS_WEB_SEARCH]", "").trimEnd() +
                "\n\n---\n🌐 **Searching the web...**",
            };
          }
          return updated;
        });

        // 2. Fire a second request with search enabled and is_retry=true (skips DB save)
        try {
          const retryResponse = await fetch("http://localhost:8080/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              prompt: finalUserMessage,
              conversation_id: targetConvId,
              model: selectedModel,
              enable_search: true,
              is_retry: true,
              client_context: {
                timestamp: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            }),
          });

          if (retryResponse.ok && retryResponse.body) {
            // Replace the "Searching..." placeholder with the actual separator
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content.replace(
                    "\n\n---\n🌐 **Searching the web...**",
                    "\n\n---\n🌐 **Ažurni podaci sa weba:**\n",
                  ),
                };
              }
              return updated;
            });

            const retryReader = retryResponse.body.getReader();
            const retryDecoder = new TextDecoder();
            let retryBuffer = "";

            while (true) {
              const { value, done } = await retryReader.read();
              if (done) break;

              retryBuffer += retryDecoder.decode(value, { stream: true });
              const retryLines = retryBuffer.split("\n");
              retryBuffer = retryLines.pop() || "";

              for (const line of retryLines) {
                if (line.startsWith("data: ")) {
                  try {
                    const rawData = JSON.parse(line.replace("data: ", ""));
                    if (rawData?._type === "title_update") continue;
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (!last) return prev;
                      updated[updated.length - 1] = {
                        ...last,
                        content: (last.content || "") + rawData,
                      };
                      return updated;
                    });
                  } catch (e) {}
                }
              }
            }
          }
        } catch (retryErr) {
          console.error("Web search retry failed:", retryErr);
          // Remove the searching indicator on failure
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content.replace(
                  "\n\n---\n🌐 **Searching the web...**",
                  "",
                ),
              };
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error("Stream failed:", err);
      if (isNewChat && isAuthenticated) {
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
      {isAuthenticated && (
        <AppSidebar
          onNewChat={() => {
            setMessages([]);
            setInput("");
          }}
        />
      )}
      <SidebarInset
        className="flex flex-col h-full relative overflow-hidden bg-background"
        onDragEnter={handleDragEnter}
      >
        {!isAuthenticated && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-muted/50 border-b border-border text-sm text-muted-foreground shrink-0">
            Guest mode — conversations won't be saved.{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            {" "}or{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Create account</Link>
          </div>
        )}
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
                  uploadedFile={stagedFile}
                  onClearFile={clearStagedFile}
                  isUploading={isUploading}
                  activeConversationId={activeConversationId}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  enableSearch={enableSearch}
                  setEnableSearch={setEnableSearch}
                />
              </motion.div>
            </div>
          </main>
        ) : (
          <main className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
            <div
              className="flex-1 w-full overflow-y-auto px-4 pt-8"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <div className="max-w-3xl mx-auto pb-4">
                <StreamWindow
                  messages={messages}
                  scrollRef={scrollRef}
                  loading={loading}
                  user={user}
                />
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
                  uploadedFile={stagedFile}
                  onClearFile={clearStagedFile}
                  isUploading={isUploading}
                  activeConversationId={activeConversationId}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  enableSearch={enableSearch}
                  setEnableSearch={setEnableSearch}
                />
              </motion.div>
            </div>
          </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
