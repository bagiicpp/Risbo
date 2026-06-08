import { User, Sliders, Trophy } from "lucide-react";

import { Link, Outlet, useLocation, useNavigate } from "react-router";

export function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background text-foreground font-dmsans pt-10">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/50 bg-background/50 shrink-0">
        <div className="p-4 md:p-6">
          <h2 className="hidden md:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            Configuration
          </h2>

          <div className="flex md:flex-col gap-2 overflow-x-auto pb-1">
            <NavButton
              to="/settings/profile"
              active={location.pathname.includes("/profile")}
              icon={<User size={16} />}
              label="Profile"
            />

            <NavButton
              to="/settings/sport"
              active={location.pathname.includes("/sport")}
              icon={<Trophy size={16} />}
              label="Sport"
            />

            <NavButton
              to="/settings/preferences"
              active={location.pathname.includes("/preferences")}
              icon={<Sliders size={16} />}
              label="Preferences"
            />
          </div>
        </div>
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
    className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 text-sm transition-all duration-200 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap ${
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`}
  >
    {icon}

    {label}
  </Link>
);
