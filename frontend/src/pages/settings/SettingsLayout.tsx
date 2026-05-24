import { User, Sliders, ArrowLeft } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

export function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    // FIX 1: Changed h-full to h-screen to guarantee the container has a strict boundary
    <div className="flex h-screen w-full bg-background text-foreground font-dmsans">
      {/* Navigation Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-background/50 p-6 flex flex-col gap-2 shrink-0">
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center cursor-pointer gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 px-2 py-1.5 -ml-2 rounded-md transition-colors w-fit mb-6 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={16} />
          Home
        </button>

        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Configuration
        </h2>

        <NavButton
          to="/settings/profile"
          active={location.pathname.includes("/profile")}
          icon={<User size={16} />}
          label="User Profile"
        />
        <NavButton
          to="/settings/preferences"
          active={location.pathname.includes("/preferences")}
          icon={<Sliders size={16} />}
          label="Preferences"
        />
      </aside>

      <main className="flex-1 overflow-y-auto bg-background/50">
        <div className="w-full max-w-3xl mx-auto pt-16 pb-24 px-10 transition-all duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const NavButton = ({
  to,
  active,
  icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) => (
  <Link
    to={to}
    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`}
  >
    {icon}
    {label}
  </Link>
);
