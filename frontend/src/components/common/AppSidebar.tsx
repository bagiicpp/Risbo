import {
  Settings,
  LogOut,
  Download,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sun,
  Moon,
  MessageSquare,
  Loader2,
  User,
  Search,
  Pencil,
  Trash2,
  MoreVertical,
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
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { useTheme } from "@/context/ThemeProvider";
import { useConversations } from "@/hooks/useConversations";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useAuth();
  const displayName = user?.name || "User";

  const displayInitial = displayName
    ? displayName.charAt(0).toUpperCase()
    : "U";

  const displayPlan = user?.plan || "Free plan";
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const {
    conversations,
    loading,
    activeConversationId,
    setActiveConversationId,
    generatingTitleId,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations =
    conversations?.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  useEffect(() => {
    console.log("Current conversations array:", conversations);
  }, [conversations]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    navigate("/chat");
  };

  const handleRenameClick = (id: string, currentTitle: string) => {
    console.log("Renaming chat:", id, currentTitle);
  };

  const handleDeleteClick = async (id: string) => {
    console.log("Deleting chat:", id);
  };

  console.log("Current Generating ID:", generatingTitleId);
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-4 px-4 group-data-[collapsible=icon]:px-2">
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
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="font-dmsans text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
            Recent Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
              </div>
            ) : filteredConversations.length === 0 ? (
              // FIX: Added the fallback state if search yields no results
              <div className="text-center py-4 text-sm text-muted-foreground font-dmsans italic">
                {searchQuery ? "No matching chats." : "No history yet."}
              </div>
            ) : (
              <SidebarMenu>
                {filteredConversations.map((chat) => {
                  // 1. Check if this specific chat ID matches the one currently being polled
                  const isGenerating = generatingTitleId === chat._id;

                  return (
                    <div
                      key={chat._id}
                      className="group relative flex items-center w-full rounded-lg hover:bg-accent/50 transition-colors duration-200 cursor-pointer overflow-hidden border border-transparent hover:border-border/50"
                      onClick={() => navigate(`/chat/${chat._id}`)}
                    >
                      {/* 2. THE DYNAMIC TITLE UI */}
                      {isGenerating ? (
                        <div className="flex-1 flex items-center pl-3 pr-9 py-2 gap-2 text-sm font-medium text-primary">
                          <Loader2 className="size-3.5 animate-spin shrink-0" />
                          <span className="truncate opacity-80 animate-pulse">
                            Generating...
                          </span>
                        </div>
                      ) : (
                        <span className="flex-1 truncate pl-3 pr-9 py-2 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                          {chat.title}
                        </span>
                      )}

                      {/* Dropdown Menu */}
                      <div className="absolute right-1 flex items-center opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
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
                                e.stopPropagation();
                                handleRenameClick(chat._id, chat.title);
                              }}
                              className="cursor-pointer focus:bg-accent"
                            >
                              <Pencil className="mr-2 size-4 text-muted-foreground" />
                              <span>Rename</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-border/50" />

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(chat._id);
                              }}
                              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                            >
                              <Trash2 className="mr-2 size-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-3 group-data-[collapsible=icon]:p-2 flex flex-col gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full gap-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 cursor-pointer group-data-[collapsible=icon]:justify-center h-9"
              tooltip="Settings"
            >
              <Settings size={18} className="shrink-0" />
              <span className="font-medium font-dmsans group-data-[collapsible=icon]:hidden">
                Settings
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full h-14 mt-1 rounded-xl data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent transition-all duration-300 cursor-pointer border border-transparent hover:border-border/50 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0.5 overflow-hidden"
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
                <DropdownMenuItem
                  className="gap-3 cursor-pointer rounded-lg p-2.5 transition-colors focus:bg-accent"
                  onClick={() => navigate("/profile")}
                >
                  <User size={16} className="text-muted-foreground" />
                  <span className="font-medium">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 cursor-pointer rounded-lg p-2.5 transition-colors focus:bg-accent"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun size={16} className="text-muted-foreground" />
                  ) : (
                    <Moon size={16} className="text-muted-foreground" />
                  )}
                  <span className="font-medium">Toggle Theme</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer rounded-lg p-2.5 transition-colors focus:bg-accent">
                  <Download size={16} className="text-muted-foreground" />
                  <span className="font-medium">Export Data</span>
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
  );
}
