import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import ChatInput from "@/components/chat/ChatInput";
import StreamWindow from "@/components/chat/StreamWindow";
import type { Message } from "@/components/chat/StreamWindow";
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
  const streamAbortRef = useRef<AbortController | null>(null);

  const stopStream = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      setLoading(false);
    }
  };

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
            const formattedHistory = (data.messages || [])
              .filter((msg: any) => msg.role !== "system")
              .map((msg: any) => ({
                message_id: msg.message_id,
                role: msg.role,
                content: msg.content,
              }));
            setMessages(formattedHistory);
          } else {
            console.error("Conversation not found, falling back.");
            navigate("/chat", { replace: true });
          }
        } catch (err: any) {
          if (err.name !== "AbortError")
            console.error("Failed loading chat history:", err);
        }
      };
      loadHistoryLog();
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }

    return () => abortController.abort();
  }, [conversationId]);

  const handleScroll = () => {
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

  const handleFileUpload = (file: File) => setStagedFile(file);
  const clearStagedFile = () => setStagedFile(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeConversationId) setDragActive(true);
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // =========================================================================
  // DEFENSIVE FUNCTION SIGNATURE: Catch React Events masquerading as strings
  // =========================================================================
  const handleSendMessage = async (
    overrideContent?: string | React.SyntheticEvent | any,
    truncateId?: string | any,
  ) => {
    // 1. Defend against Event Bleeding: Ensure we only accept literal strings.
    const actualOverride =
      overrideContent && typeof overrideContent === "string"
        ? overrideContent
        : undefined;
    const actualTruncateId =
      truncateId && typeof truncateId === "string" ? truncateId : undefined;

    const messageText = actualOverride ?? input.trim();
    if ((!messageText && !stagedFile) || loading) return;

    streamAbortRef.current = new AbortController();
    isAutoScrollEnabled.current = true;

    let finalUserMessage = messageText;
    const displayMessage = stagedFile
      ? stagedFile.type.startsWith("image/")
        ? messageText
          ? `[IMAGE: ${stagedFile.name}]\n${messageText}`
          : `[IMAGE: ${stagedFile.name}]`
        : `[FILE: ${stagedFile.name}]\n${messageText}`
      : messageText;

    setLoading(true);
    if (!actualOverride) setInput("");

    const currentMessageId =
      actualTruncateId || crypto.randomUUID().replace(/-/g, "");

    // --- PHASE 1: PRE-PROCESS STAGED FILE ---
    let overrideConversationId: string | null = null;
    if (stagedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", stagedFile);

      try {
        if (stagedFile.type.startsWith("image/")) {
          const convId = activeConversationId || "new";
          const uploadRes = await fetch(
            `http://localhost:8080/upload-image/${convId}`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            },
          );

          if (!uploadRes.ok) throw new Error("Failed to upload image");
          const uploadData = await uploadRes.json();

          // If this was a new conversation, use the ID the backend just created
          if (!activeConversationId && uploadData.conversation_id) {
            setActiveConversationId(uploadData.conversation_id);
            overrideConversationId = uploadData.conversation_id;
          }

          finalUserMessage = finalUserMessage
            ? `[ATTACHED IMAGE: ${stagedFile.name}]\n${finalUserMessage}`
            : `[ATTACHED IMAGE: ${stagedFile.name}]`;
        } else {
          // --- DOCUMENT: existing extract-text flow ---
          const extractRes = await fetch("http://localhost:8080/extract-text", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (!extractRes.ok)
            throw new Error("Failed to extract text from document");
          const extractData = await extractRes.json();

          finalUserMessage = `[ATTACHED DOCUMENT: ${stagedFile.name}]\n${extractData.text}\n\n${finalUserMessage}`;
        }
      } catch (err) {
        console.error("File processing failed:", err);
        setMessages((prev) => {
          let baseMessages = prev;
          if (truncateId) {
            const truncateIndex = prev.findIndex(
              (m) => m.message_id === truncateId,
            );
            if (truncateIndex !== -1)
              baseMessages = prev.slice(0, truncateIndex);
          }
          return [
            ...baseMessages,
            {
              role: "assistant",
              content: "❌ **Error:** Failed to process the attached file.",
            },
          ];
        });
        setLoading(false);
        setIsUploading(false);
        setStagedFile(null);
        return;
      } finally {
        setIsUploading(false);
        setStagedFile(null);
      }
    }

    // --- PHASE 2: OPTIMISTIC UI UPDATE WITH TRUNCATION ---
    setMessages((prev) => {
      let baseMessages = prev;
      if (actualTruncateId) {
        const truncateIndex = prev.findIndex(
          (m) => m.message_id === actualTruncateId,
        );
        if (truncateIndex !== -1) {
          baseMessages = prev.slice(0, truncateIndex);
        }
      }
      return [
        ...baseMessages,
        { role: "user", content: displayMessage, message_id: currentMessageId },
        { role: "assistant", content: "" },
      ];
    });

    const isNewChat = !activeConversationId;
    const tempId = `optimistic_${Date.now()}`;
    const provisionalTitle =
      typeof displayMessage === "string"
        ? displayMessage.substring(0, 25) + "..."
        : "New Conversation...";

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
        signal: streamAbortRef.current.signal,
        body: JSON.stringify({
          prompt: finalUserMessage,
          conversation_id: isNewChat
            ? overrideConversationId || null
            : overrideConversationId || activeConversationId,
          model: selectedModel,
          enable_search: enableSearch,
          truncate_from_message_id: actualTruncateId || null,
          message_id: currentMessageId,
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

              // 2. Defend Against Object Coercion in Text Streams
              const textChunk =
                typeof rawData === "string"
                  ? rawData
                  : rawData.content || rawData.text || JSON.stringify(rawData);

              accumulatedContent += textChunk;

              setMessages((prev) => {
                const updatedMessages = [...prev];
                const lastIndex = updatedMessages.length - 1;
                if (!updatedMessages[lastIndex]) return prev;

                updatedMessages[lastIndex] = {
                  ...updatedMessages[lastIndex],
                  content:
                    (updatedMessages[lastIndex].content || "") + textChunk,
                };
                return updatedMessages;
              });
            } catch (e) {}
          }
        }
      }

      // --- AUTO-RETRY on [NEEDS_WEB_SEARCH] marker ---
      if (!enableSearch && accumulatedContent.includes("[NEEDS_WEB_SEARCH]")) {
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
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
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

                    const textChunk =
                      typeof rawData === "string"
                        ? rawData
                        : rawData.content ||
                          rawData.text ||
                          JSON.stringify(rawData);

                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (!last) return prev;
                      updated[updated.length - 1] = {
                        ...last,
                        content: (last.content || "") + textChunk,
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
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream safely stopped by user.");
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content:
                updated[lastIndex].content + "\n\n### Stream stopped by user",
            };
          }
          return updated;
        });
        return;
      }

      console.error("Stream failed:", err);
      if (isNewChat && isAuthenticated) {
        setGeneratingTitleId(null);
        await fetchConversations();
      }

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        if (updated[lastIndex]?.role === "assistant") {
          const existingText = updated[lastIndex].content;
          if (
            typeof existingText === "string" &&
            existingText.trim().length > 0
          ) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content:
                existingText +
                "\n\n⚠️ *Stream interrupted at the very end, but response was preserved.*",
            };
          } else {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: "### Connection Error\nFailed to reach the AI backend.",
            };
          }
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (loading) return;
    handleSendMessage(newContent, messageId);
  };

  const handleRegenerate = () => {
    if (loading || messages.length < 2) return;
    const lastUserMessageIndex = messages
      .map((m) => m.role)
      .lastIndexOf("user");
    if (lastUserMessageIndex === -1) return;

    const targetUserMessage = messages[lastUserMessageIndex];
    if (!targetUserMessage.message_id) return;

    handleSendMessage(targetUserMessage.content, targetUserMessage.message_id);
  };

  return (
    <>
      {!isAuthenticated && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-muted/50 border-b border-border text-sm text-muted-foreground shrink-0">
          Guest mode — conversations won't be saved.{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>{" "}
          or{" "}
          <Link
            to="/register"
            className="text-primary hover:underline font-medium"
          >
            Create account
          </Link>
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
                stopStream={stopStream}
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
                onEditMessage={handleEditMessage}
                onRegenerate={handleRegenerate}
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
                stopStream={stopStream}
              />
            </motion.div>
          </div>
        </main>
      )}
    </>
  );
}
