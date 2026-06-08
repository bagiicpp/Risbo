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
        {isAuthenticated && (
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-4">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />

            <div className="h-4 w-[1px] bg-border/60 mx-2 hidden sm:block" />
          </header>
        )}

        <main className="flex-1 w-full flex flex-col min-h-0 relative overflow-x-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
