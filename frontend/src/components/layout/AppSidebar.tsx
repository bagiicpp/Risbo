import {
  Target,
  Activity,
  Flame,
  Dumbbell,
  Zap,
  Moon,
  Sun,
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
} from "@/components/ui/sidebar";
import { useTheme } from "@/context/ThemeProvider";

const athleteContext = [
  { title: "Weight", value: "85 kg", icon: Activity },
  { title: "Current Goal", value: "Hypertrophy", icon: Target },
  { title: "Current Split", value: "Push/Pull/Legs", icon: Dumbbell },
  { title: "Activity Level", value: "High", icon: Flame },
];

export function AppSidebar() {
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-border"
    >
      <SidebarHeader className="p-4 space-y-6 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:space-y-4">
        {/* Branding: Shows 'Risbo' when open, just the 'R' box when collapsed */}
        <div className="flex items-center gap-2 overflow-hidden mt-1">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-primary font-black italic text-lg">R</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-foreground group-data-[collapsible=icon]:hidden whitespace-nowrap transition-all">
            Risbo <span className="text-primary text-sm">v1.0</span>
          </h1>
        </div>

        {/* The Advertisement Block: Completely hidden when collapsed */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group-hover:border-primary/40 transition-colors group-data-[collapsible=icon]:hidden">
          <div className="absolute -right-4 -top-4 bg-primary/20 w-16 h-16 rounded-full blur-xl transition-all" />
          <div className="flex items-center gap-2 text-primary font-bold text-sm z-10 whitespace-nowrap">
            <Zap className="h-4 w-4 fill-primary" /> Upgrade to Pro
          </div>
          <p className="text-xs text-foreground/80 font-medium z-10">
            Unlock advanced MLOps integrations, infinite memory, and FERI
            telemetry tracking.
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold tracking-wider group-data-[collapsible=icon]:hidden whitespace-nowrap">
            Athlete Profile
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {athleteContext.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Added Tooltip for collapsed hover state */}
                  <SidebarMenuButton
                    tooltip={`${item.title}: ${item.value}`}
                    className="pointer-events-none hover:bg-transparent h-12"
                  >
                    <item.icon className="text-primary h-5 w-5 shrink-0" />

                    {/* Text wrapper: hidden when collapsed */}
                    <div className="flex flex-col items-start justify-center ml-3 group-data-[collapsible=icon]:hidden overflow-hidden">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold whitespace-nowrap">
                        {item.title}
                      </span>
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                        {item.value}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              tooltip={theme === "dark" ? "Light Mode" : "Dark Mode"}
              className="h-10 hover:bg-muted transition-colors cursor-pointer justify-center group-data-[collapsible=icon]:justify-start"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-muted-foreground shrink-0" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              {/* Hide text when collapsed */}
              <span className="ml-2 font-semibold text-sm group-data-[collapsible=icon]:hidden whitespace-nowrap">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
