import { Outlet } from "react-router";
import { AppSidebar } from "@/components/common/AppSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export function MainLayout() {
  const { isAuthenticated } = useAuth();
  return (
    <SidebarProvider className="h-screen w-full overflow-hidden font-dmsans">
      {isAuthenticated && <AppSidebar />}

      <SidebarInset className="flex flex-col h-full relative overflow-hidden bg-background">
        <header className="flex md:hidden h-14 shrink-0 items-center gap-2 px-4 absolute top-0 left-0 z-50">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground cursor-pointer bg-background/80 backdrop-blur border border-border/40 rounded-md p-2 shadow-sm" />
        </header>

        {/* Ensure main content spans the full container height */}
        <main className="flex-1 w-full flex flex-col min-h-0 relative overflow-x-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
