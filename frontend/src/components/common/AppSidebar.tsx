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
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center mb-2 min-h-8">
          <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:hidden">
            {/* Branding container initial letter using font-bricolage */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
              <span className="text-primary-foreground font-bricolage font-extrabold italic text-lg leading-none">
                R
              </span>
            </div>
            {!isCollapsed && (
              /* Title using font-bricolage explicitly */
              <h1 className="text-xl font-bricolage font-bold tracking-tight text-foreground whitespace-nowrap flex items-baseline gap-1">
                Risbo{" "}
                <span className="font-dmsans text-primary/70 text-[10px] font-semibold uppercase tracking-widest">
                  v1.0
                </span>
              </h1>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleNewChat}
              className="w-full h-10 mt-4 gap-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer font-dmsans font-medium shadow-sm"
              tooltip="New Chat"
            >
              <Plus
                size={18}
                className="shrink-0 transition-transform group-hover:rotate-90 duration-300"
              />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Recents Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-dmsans text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1 group-data-[collapsible=icon]:hidden">
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
                        <span className="truncate max-w-[160px] text-sm group-data-[collapsible=icon]:hidden">
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

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full h-14 rounded-xl data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent transition-all duration-200 cursor-pointer border border-transparent hover:border-border/50 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
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
                  <Settings size={16} className="text-muted-foreground" />
                  <span className="font-medium">Settings</span>
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
