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

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

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

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    navigate("/chat");
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-4 px-4 group-data-[collapsible=icon]:px-2">
        <div className="relative flex items-center w-full h-8 mb-2">
          {/* --- EXPANDED VIEW --- */}
          <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
              <span className="text-primary-foreground font-bricolage font-extrabold italic text-lg leading-none">
                R
              </span>
            </div>
            <h1 className="text-xl font-bricolage font-bold tracking-tight text-foreground whitespace-nowrap flex items-baseline gap-1">
              Risbo{" "}
              <span className="font-dmsans text-primary/70 text-[10px] font-semibold uppercase tracking-widest">
                v1.0
              </span>
            </h1>
            {/* Standard Close Button pinned to the right */}
            <button
              onClick={toggleSidebar}
              className="ml-auto p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center w-8 h-8"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* --- COLLAPSED VIEW --- */}
          <div className="hidden group-data-[collapsible=icon]:flex w-full justify-center">
            <button
              onClick={toggleSidebar}
              className="relative w-8 h-8 flex items-center justify-center group/toggle cursor-pointer"
            >
              {/* The "R" Branding - Default state, fades out on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center rounded-xl shadow-sm shadow-primary/20 transition-opacity duration-200 group-hover/toggle:opacity-0">
                <span className="text-primary-foreground font-bricolage font-extrabold italic text-lg leading-none">
                  R
                </span>
              </div>

              {/* The Toggle Icon - Hidden by default, fades in on hover */}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-accent text-foreground opacity-0 transition-opacity duration-200 group-hover/toggle:opacity-100">
                <PanelLeftOpen size={18} />
              </div>
            </button>
          </div>
        </div>

        <SidebarMenu className="space-y-1 mt-2">
          {/* Search Placeholder */}
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full h-9 gap-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 cursor-pointer font-dmsans group-data-[collapsible=icon]:justify-center"
              tooltip="Search Chats"
            >
              <Search size={18} className="shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                Search chats
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* New Chat Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleNewChat}
              className="w-full h-10 gap-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer font-dmsans font-medium shadow-sm group-data-[collapsible=icon]:justify-center"
              tooltip="New Chat"
            >
              <Plus
                size={18}
                className="shrink-0 transition-transform group-hover:rotate-90 duration-300"
              />
              <span className="group-data-[collapsible=icon]:hidden">
                New chat
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/*
        The entire Content section is now hidden when collapsed,
        leaving only the top and bottom quick actions visible.
      */}
      <SidebarContent className="px-2 group-data-[collapsible=icon]:hidden">
        {/* Recents Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-dmsans text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
            Recent Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
              </div>
            ) : (
              <SidebarMenu>
                {conversations.map((conv) => {
                  const isActive = conv._id === activeConversationId;
                  const isGenerating = conv._id === generatingTitleId;

                  if (isGenerating) {
                    return (
                      <SidebarMenuItem key={conv._id}>
                        <div className="flex w-full gap-3 px-3 py-2 items-center rounded-lg bg-primary/5 border border-primary/10">
                          <Loader2 className="w-4 h-4 animate-spin text-primary/60 shrink-0" />
                          <div className="h-3.5 w-3/4 bg-primary/15 rounded-md animate-pulse"></div>
                        </div>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={conv._id}>
                      <SidebarMenuButton
                        onClick={() => handleSelectConversation(conv._id)}
                        className={`w-full gap-3 rounded-lg font-dmsans transition-all duration-200 justify-start align-middle px-3 py-2 ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                        tooltip={conv.title}
                      >
                        <MessageSquare size={16} className="shrink-0" />
                        <span className="truncate max-w-[160px] text-sm">
                          {conv.title}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-3 group-data-[collapsible=icon]:p-2 flex flex-col gap-1">
        <SidebarMenu>
          {/* Quick Action: Settings */}
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

          {/* User Profile Dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full h-14 mt-1 rounded-xl data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent transition-all duration-200 cursor-pointer border border-transparent hover:border-border/50 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
                >
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bricolage font-bold border border-primary/20 shadow-sm shrink-0">
                    B
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2 font-dmsans">
                    <span className="truncate font-semibold text-foreground">
                      Blagoja
                    </span>
                    <span className="truncate text-xs text-muted-foreground font-medium">
                      Free plan
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden transition-transform group-data-[state=open]:rotate-180 duration-200 shrink-0" />
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
