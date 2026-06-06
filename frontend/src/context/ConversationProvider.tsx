import React, { useState, useEffect, useCallback } from "react";
import { ConversationContext } from "./ConversationContext";
import type { ConversationMeta } from "./ConversationContext";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/api";

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated, logout } = useAuth();

  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [generatingTitleId, setGeneratingTitleId] = useState<string | null>(
    null,
  );

  const fetchConversations = useCallback(async () => {
    if (!token) return null;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/conversations?t=${Date.now()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-store",
        },
      );

      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        return data; // Return it so ChatPage can inspect it!
      } else if (res.status === 401) {
        console.warn("Session invalid or expired. Logging out.");
        logout();
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
    return null;
  }, [token, logout]);

  useEffect(() => {
    let isMounted = true;

    if (!token || !isAuthenticated) {
      if (isMounted) {
        setConversations([]);
        setLoading(false);
      }
      return;
    }

    const syncConversations = async () => {
      try {
        const res = await fetch(`${API_URL}/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          setConversations(data);
        } else if (res.status === 401 && isMounted) {
          // 3. Handle the automatic logout on the initial mount fetch as well
          console.warn("Session invalid or expired. Logging out.");
          logout();
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncConversations();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated, logout]);

  const addProvisionalConversation = useCallback(
    (id: string, title: string) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === id);
        if (exists) return prev;

        const newMeta: ConversationMeta = {
          _id: id,
          title,
          user_id: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [newMeta, ...prev];
      });
      setActiveConversationId(id);
    },
    [],
  );

  const swapProvisionalId = useCallback((oldId: string, newId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === oldId ? { ...c, _id: newId } : c)),
    );
    setActiveConversationId((prev) => (prev === oldId ? newId : prev));
    setGeneratingTitleId((prev) => (prev === oldId ? newId : prev));
  }, []);

  const updateConversationTitle = useCallback(
    (id: string, newTitle: string) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c._id === id ? { ...c, title: newTitle } : c,
        );
        return [...next];
      });
    },
    [],
  );

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        loading,
        activeConversationId,
        setActiveConversationId,
        fetchConversations,
        addProvisionalConversation,
        swapProvisionalId,
        generatingTitleId,
        setGeneratingTitleId,
        updateConversationTitle,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};
