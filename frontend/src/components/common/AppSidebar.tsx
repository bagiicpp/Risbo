import {
  Settings,
  LogOut,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Loader2,
  User,
  Search,
  Pencil,
  Trash2,
  MoreVertical,
  Users,
  ChevronDown,
  ChevronRight,
  Activity,
  Beef,
  Inbox,
  Send,
  CheckCircle2,
  X,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router";
import { useConversations } from "@/hooks/useConversations";
import { useCallback, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import axios from "axios";

export function AppSidebar({ onNewChat }: { onNewChat?: () => void } = {}) {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    if (isCollapsed) {
      toggleSidebar();
    }
  }, [location.pathname]);

  const displayName = user?.name || "User";
  const displayInitial = displayName
    ? displayName.charAt(0).toUpperCase()
    : "U";
  const displayPlan = user?.plan || "Free plan";

  const {
    conversations,
    loading,
    activeConversationId,
    setActiveConversationId,
    generatingTitleId,
    fetchConversations,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetChat, setTargetChat] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- COACH STATE ---
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [coachRoster, setCoachRoster] = useState<any[]>([]);
  const [athleteCount, setAthleteCount] = useState(0);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);

  const sortedOutbox = useMemo(() => {
    return [...coachRoster].sort((a, b) => {
      const order: Record<string, number> = {
        pending: 0,
        rejected: 1,
        active: 2,
        unknown: 3,
      };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  }, [coachRoster]);

  // --- ATHLETE STATE ---
  const [isCoachesOpen, setIsCoachesOpen] = useState(false);
  const [myCoaches, setMyCoaches] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [pendingInvites, setPendingInvites] = useState<
    { coach_id: string; name: string; email: string }[]
  >([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isResponding, setIsResponding] = useState<string | null>(null);

  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  }, []);

  useEffect(() => {
    if (!token || !user?.role) return;

    const abortController = new AbortController();
    let eventSource: EventSource | null = null;
    let connectionTimeout: ReturnType<typeof setTimeout>;

    const fetchCoachData = async () => {
      try {
        const res = await api.get("/roster/athletes", {
          signal: abortController.signal,
        });
        setCoachRoster(res.data);
        setAthleteCount(
          res.data.filter((a: any) => a.status === "active").length,
        );
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Failed to fetch roster:", err);
      }
    };

    const fetchAthleteData = async () => {
      try {
        const [invitesRes, coachesRes] = await Promise.all([
          api.get("/athlete/invites", { signal: abortController.signal }),
          api.get("/athlete/coaches", { signal: abortController.signal }),
        ]);
        setPendingInvites(invitesRes.data);
        setMyCoaches(coachesRes.data);
      } catch (err) {
        if (!axios.isCancel(err))
          console.error("Failed to fetch athlete data:", err);
      }
    };

    if (user.role === "coach") fetchCoachData();
    if (user.role === "athlete") fetchAthleteData();

    connectionTimeout = setTimeout(() => {
      const streamUrl =
        user.role === "coach"
          ? `${import.meta.env.VITE_API_URL}/coach/roster/stream?token=${token}`
          : `${import.meta.env.VITE_API_URL}/invites/stream?token=${token}`;

      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data !== "object" || !data) return;

          if (user.role === "coach" && data.event === "ROSTER_UPDATE") {
            fetchCoachData();
            toast.info("An athlete responded to your invite.");
          } else if (user.role === "athlete" && data.event === "NEW_INVITE") {
            fetchAthleteData();
            toast("You received a new coach invite!", { icon: "📩" });
          }
        } catch (err) {
          console.error(`Failed to parse SSE event:`, err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn(`SSE Connection interrupted. Auto-reconnecting...`, err);
      };
    }, 500);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      abortController.abort();
      clearTimeout(connectionTimeout);
      if (eventSource) eventSource.close();
    };
  }, [user?.role, token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRespondToInvite = async (
    coach_id: string,
    action: "accept" | "reject",
  ) => {
    setIsResponding(coach_id);
    try {
      await api.post(`/athlete/invites/${coach_id}/respond`, { action });
      setPendingInvites((prev) =>
        prev.filter((inv) => inv.coach_id !== coach_id),
      );

      if (action === "accept") {
        toast.success("Invite accepted! Coach added to roster.");
        const res = await api.get("/athlete/coaches");
        setMyCoaches(res.data);
      } else {
        toast.success("Invite rejected.");
      }
    } catch (error) {
      console.error("Failed to respond to invite:", error);
      toast.error("Failed to process invite.");
    } finally {
      setIsResponding(null);
    }
  };

  const filteredConversations =
    conversations?.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);

    if (onNewChat) {
      onNewChat();
    }

    navigate("/chat", { replace: true });
  };

  const handleRenameClick = (id: string, currentTitle: string) => {
    setTargetChat({ id, title: currentTitle });
    setNewTitle(currentTitle);
    setIsRenameOpen(true);
  };

  const handleDeleteClick = (id: string, currentTitle: string) => {
    setTargetChat({ id, title: currentTitle });
    setIsDeleteOpen(true);
  };

  const confirmRename = async () => {
    if (!targetChat || !newTitle.trim()) return;
    setIsProcessing(true);
    try {
      await api.patch(`/conversations/${targetChat.id}`, { title: newTitle });
      if (fetchConversations) await fetchConversations();
    } catch (error) {
      console.error("Failed to rename:", error);
    } finally {
      setIsProcessing(false);
      setIsRenameOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!targetChat) return;
    setIsProcessing(true);
    try {
      await api.delete(`/conversations/${targetChat.id}`);
      if (activeConversationId === targetChat.id) {
        setActiveConversationId(null);
        navigate("/chat");
      }
      if (fetchConversations) await fetchConversations();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsProcessing(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="py-4 px-4 group-data-[collapsible=icon]:px-2">
          {/* Header Block */}
          <div className="relative flex items-center w-full h-8 mb-2 overflow-visible group/header">
            <div
              onClick={() => isCollapsed && toggleSidebar()}
              className={`relative w-8 h-8 flex items-center justify-center shrink-0 transition-all duration-300 ${isCollapsed ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center rounded-xl shadow-sm shadow-primary/20 transition-opacity duration-200 group-data-[collapsible=icon]:group-hover/header:opacity-0 pointer-events-none">
                <span className="text-primary-foreground font-bricolage font-extrabold italic text-lg leading-none">
                  R
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-accent text-foreground opacity-0 transition-opacity duration-200 group-data-[collapsible=icon]:group-hover/header:opacity-100 pointer-events-none">
                <PanelLeftOpen size={18} />
              </div>
            </div>

            <h1 className="text-xl font-bricolage font-bold tracking-tight text-foreground whitespace-nowrap flex items-baseline gap-1 ml-3 transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-ml-3 group-data-[collapsible=icon]:pointer-events-none select-none">
              Risbo{" "}
              <span className="font-dmsans text-primary/70 text-[10px] font-semibold uppercase tracking-widest">
                v1.0
              </span>
            </h1>

            <button
              onClick={toggleSidebar}
              className="ml-auto p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer shrink-0 flex items-center justify-center w-8 h-8 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:pointer-events-none overflow-hidden"
            >
              <PanelLeftClose size={18} className="shrink-0" />
            </button>
          </div>

          <SidebarMenu className="space-y-1 mt-2">
            <SidebarMenuItem>
              <div className="relative group flex items-center w-full h-9 px-2 bg-background border border-border/50 rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm overflow-hidden">
                <Search
                  size={18}
                  className="text-muted-foreground shrink-0 group-focus-within:text-primary transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search chats"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-dmsans text-foreground placeholder:text-muted-foreground ml-2 transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:p-0"
                />
              </div>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleNewChat}
                className="w-full h-10 gap-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer font-dmsans font-medium shadow-sm overflow-hidden"
                tooltip="New Chat"
              >
                <Plus
                  size={18}
                  className="shrink-0 transition-transform group-hover:rotate-90 duration-300"
                />
                <span className="truncate transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-3">
                  New chat
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.startsWith("/kitchen")}
                tooltip="Smart Kitchen"
                className="w-full h-10 gap-3 rounded-xl transition-all duration-300 cursor-pointer font-dmsans font-medium shadow-sm overflow-hidden"
              >
                <Link to="/kitchen">
                  <Beef
                    size={18}
                    className="shrink-0 transition-transform group-hover:scale-110 duration-300"
                  />
                  <span className="truncate transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-3">
                    Smart Kitchen
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* COACH ZONE */}
            {user?.role === "coach" && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/coach/dashboard"}
                    tooltip="Command Center"
                    className="w-full h-10 gap-3 rounded-xl transition-all duration-300 cursor-pointer font-dmsans font-medium shadow-sm overflow-hidden"
                  >
                    <Link to="/coach/dashboard">
                      <Activity size={18} className="shrink-0" />
                      <span className="truncate transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-3">
                        Overview
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="My Rosters"
                    isActive={location.pathname.startsWith("/coach/roster")}
                    onClick={() =>
                      isCollapsed
                        ? navigate("/coach/roster")
                        : setIsRosterOpen(!isRosterOpen)
                    }
                    className="w-full h-10 gap-3 rounded-xl transition-all duration-300 cursor-pointer font-dmsans font-medium shadow-sm overflow-hidden"
                  >
                    <Users size={18} className="shrink-0" />
                    <div className="flex flex-1 items-center justify-between transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-3">
                      <span className="truncate text-left">My Rosters</span>
                      {isRosterOpen ? (
                        <ChevronDown
                          size={14}
                          className="opacity-50 shrink-0"
                        />
                      ) : (
                        <ChevronRight
                          size={14}
                          className="opacity-50 shrink-0"
                        />
                      )}
                    </div>
                  </SidebarMenuButton>

                  <AnimatePresence>
                    {isRosterOpen && !isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-2 pr-2 mt-1 space-y-1 font-dmsans"
                      >
                        {athleteCount > 0 ? (
                          <Link to="/coach/roster">
                            <SidebarMenuButton
                              isActive={location.pathname.startsWith(
                                "/coach/roster",
                              )}
                              className="w-full h-8 rounded-md text-xs cursor-pointer"
                            >
                              Main Roster{" "}
                              <span className="ml-auto text-[10px] bg-border px-1.5 rounded text-muted-foreground">
                                {athleteCount}
                              </span>
                            </SidebarMenuButton>
                          </Link>
                        ) : (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground/60 italic">
                            No active athletes
                          </div>
                        )}
                        <Link to="/coach/roster">
                          <SidebarMenuButton className="w-full h-8 cursor-pointer rounded-md text-xs text-muted-foreground border border-dashed border-border/50 mt-1 hover:text-foreground">
                            <Settings size={12} className="mr-2" /> Manage Teams
                          </SidebarMenuButton>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SidebarMenuItem>
              </>
            )}

            {/* ATHLETE ZONE */}
            {user?.role === "athlete" && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="My Coaches"
                  onClick={() => setIsCoachesOpen(!isCoachesOpen)}
                  className="w-full h-10 gap-3 rounded-xl transition-all duration-300 cursor-pointer font-dmsans font-medium shadow-sm overflow-hidden"
                >
                  <Users size={18} className="shrink-0" />
                  <div className="flex flex-1 items-center justify-between transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-3">
                    <span className="truncate text-left">My Coaches</span>
                    {isCoachesOpen ? (
                      <ChevronDown size={14} className="opacity-50 shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="opacity-50 shrink-0" />
                    )}
                  </div>
                </SidebarMenuButton>

                <AnimatePresence>
                  {isCoachesOpen && !isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-2 pr-2 mt-1 space-y-1 font-dmsans"
                    >
                      {myCoaches.length > 0 ? (
                        myCoaches.map((coach) => (
                          <div
                            key={coach.id}
                            className="w-full flex items-center h-8 px-2 rounded-md text-xs text-muted-foreground border border-transparent hover:bg-accent/50 transition-colors"
                          >
                            <User size={12} className="mr-2 opacity-70" />
                            <span className="truncate">{coach.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground/60 italic">
                          No active coaches
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 group-data-[collapsible=icon]:hidden">
          <SidebarGroup>
            <SidebarGroupLabel className="font-dmsans text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1 mt-2">
              Recent Conversations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {loading && conversations.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground font-dmsans italic">
                  {searchQuery ? "No matching chats." : "No history yet."}
                </div>
              ) : (
                <SidebarMenu>
                  {filteredConversations.map((chat) => {
                    const isGenerating = generatingTitleId === chat._id;
                    return (
                      <Link
                        key={chat._id}
                        to={`/chat/${chat._id}`}
                        onClick={() => handleSelectConversation(chat._id)}
                        className="group relative flex items-center w-full rounded-lg hover:bg-accent/50 transition-colors duration-200 cursor-pointer overflow-hidden border border-transparent hover:border-border/50"
                      >
                        {isGenerating ? (
                          <div className="flex-1 flex items-center pl-3 pr-9 py-2 gap-2 text-sm font-medium text-primary">
                            <Loader2 className="size-3.5 animate-spin shrink-0" />
                            <span className="truncate opacity-80 animate-pulse">
                              Generating...
                            </span>
                          </div>
                        ) : (
                          <span className="flex-1 truncate pl-3 pr-9 py-2 text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                            {chat.title}
                          </span>
                        )}

                        <div className="absolute right-1 flex items-center opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors mr-1 outline-none"
                              >
                                <MoreVertical className="size-4 cursor-pointer" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 font-dmsans rounded-xl border-border/50 shadow-lg"
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRenameClick(chat._id, chat.title);
                                }}
                                className="cursor-pointer"
                              >
                                <Pencil className="mr-2 size-4 text-muted-foreground" />
                                <span>Rename</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border/50" />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteClick(chat._id, chat.title);
                                }}
                                className="cursor-pointer text-destructive transition-colors"
                              >
                                <Trash2 className="mr-2 size-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Link>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="mt-auto p-3 group-data-[collapsible=icon]:p-2 flex flex-col gap-1">
          {/* ==========================================
              ATHLETE INBOX
              ========================================== */}
          {user?.role === "athlete" && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsInboxOpen(true)}
                  tooltip="Inbox"
                  className="w-full h-10 gap-3 rounded-xl transition-all duration-300 font-dmsans font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <Inbox size={18} />
                    {pendingInvites.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-2 ring-background animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-3">
                    <span className="truncate">Inbox</span>
                    {pendingInvites.length > 0 && (
                      <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-md">
                        {pendingInvites.length} new
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}

          {/* ==========================================
              COACH OUTBOX (INVITES STATUS)
              ========================================== */}
          {user?.role === "coach" && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsOutboxOpen(true)}
                  tooltip="Invites Status"
                  className="w-full h-10 gap-3 rounded-xl transition-all duration-300 font-dmsans font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <Send size={18} />
                  </div>
                  <div className="flex flex-1 items-center justify-between transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-3">
                    <span className="truncate">Invites Status</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}

          {/* ACCOUNT DROPDOWN */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full h-14 mt-1 rounded-xl data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent transition-all duration-300 cursor-pointer border border-transparent hover:border-border/50 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0.5 overflow-hidden focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
                  >
                    <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bricolage font-bold border border-primary/20 shadow-sm shrink-0 transition-all duration-300 group-data-[collapsible=icon]:rounded-xl select-none">
                      <span className="leading-none transition-transform duration-300 group-data-[collapsible=icon]:-translate-x-[2px] group-data-[collapsible=icon]:-translate-y-[1px]">
                        {displayInitial}
                      </span>
                    </div>

                    <div className="grid flex-1 text-left text-sm leading-tight ml-2 font-dmsans transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-ml-2">
                      <span className="truncate font-semibold text-foreground">
                        {displayName}
                      </span>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate text-xs text-muted-foreground font-medium capitalize">
                          {displayPlan}
                        </span>
                        {displayPlan.toLowerCase().includes("pro") && (
                          <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider font-bold leading-none border border-primary/30">
                            PRO
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronUp className="size-4 text-muted-foreground transition-all duration-300 group-data-[state=open]:rotate-180 shrink-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl p-1.5 shadow-xl border-border/50 bg-background/95 backdrop-blur-xl font-dmsans"
                  align="start"
                  sideOffset={8}
                >
                  {user?.role === "coach" ? (
                    <DropdownMenuItem
                      className="gap-3 cursor-pointer rounded-lg p-2.5 transition-colors"
                      onClick={() => navigate("/coach/dashboard")}
                    >
                      <Activity size={16} className="text-muted-foreground" />
                      <span className="font-medium">Command Center</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="gap-3 cursor-pointer rounded-lg p-2.5 transition-colors"
                      onClick={() => navigate("/profile")}
                    >
                      <User size={16} className="text-muted-foreground" />
                      <span className="font-medium">My Profile</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    className="gap-3 cursor-pointer rounded-lg p-2.5 transition-colors"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings size={16} className="text-muted-foreground" />
                    <span className="font-medium">Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5 bg-border/50" />

                  <DropdownMenuItem
                    className="gap-3 cursor-pointer rounded-lg p-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span className="font-medium">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* --- ATHLETE INBOX MODAL --- */}
      <Dialog open={isInboxOpen} onOpenChange={setIsInboxOpen}>
        <DialogContent className="font-dmsans sm:max-w-md bg-background border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bricolage">
              <Inbox size={18} className="text-primary" />
              Pending Invites
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {pendingInvites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">You're all caught up.</p>
              </div>
            ) : (
              pendingInvites.map((inv) => (
                <div
                  key={inv.coach_id}
                  className="flex items-center justify-between p-3 bg-accent/20 border border-border/50 rounded-xl hover:bg-accent/40 transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-sm font-bold text-foreground truncate">
                      {inv.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {inv.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        handleRespondToInvite(inv.coach_id, "reject")
                      }
                      disabled={isResponding === inv.coach_id}
                      className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      title="Decline"
                    >
                      {isResponding === inv.coach_id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleRespondToInvite(inv.coach_id, "accept")
                      }
                      disabled={isResponding === inv.coach_id}
                      className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      title="Accept"
                    >
                      {isResponding === inv.coach_id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- COACH OUTBOX MODAL --- */}
      <Dialog open={isOutboxOpen} onOpenChange={setIsOutboxOpen}>
        <DialogContent className="font-dmsans sm:max-w-md bg-background border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bricolage">
              <Send size={18} className="text-muted-foreground" />
              Invites Status
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {coachRoster.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Send size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">No invites sent yet.</p>
              </div>
            ) : (
              sortedOutbox.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-sm font-bold text-foreground truncate">
                      {a.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {a.email}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {a.status === "active" && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md border border-primary/20">
                        <CheckCircle2 size={12} /> Accepted
                      </span>
                    )}
                    {a.status === "pending" && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-bold uppercase tracking-wider rounded-md border border-yellow-500/20">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                    {a.status === "rejected" && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider rounded-md border border-destructive/20">
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- RENAME DIALOG --- */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="font-dmsans sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title..."
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRename}
              disabled={isProcessing || !newTitle.trim()}
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE DIALOG --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="font-dmsans sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                "{targetChat?.title}"
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
