import { Outlet } from "react-router";
import { AppSidebar } from "@/components/common/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export function MainLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <SidebarProvider className="h-screen w-full overflow-hidden font-dmsans">
      {isAuthenticated && <AppSidebar />}

      <SidebarInset className="flex flex-col h-full relative overflow-hidden bg-background">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
