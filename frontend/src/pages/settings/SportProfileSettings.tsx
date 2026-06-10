import React, { useState, useEffect } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

type Role = "coach" | "athlete" | "scout" | "analyst";
type Sport = "football" | "basketball";

interface SportProfileState {
  role: Role;
  sport: Sport[];
  team: string;
  league: string;
  focus: string[];
}

const ROLES: { id: Role; label: string }[] = [
  { id: "coach", label: "Coach" },
  { id: "athlete", label: "Athlete" },
  { id: "scout", label: "Scout" },
  { id: "analyst", label: "Analyst" },
];

const SPORTS: { id: Sport; label: string }[] = [
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
];

const FOCUS_OPTIONS: { id: string; label: string }[] = [
  { id: "tactics", label: "Tactics" },
  { id: "player_analysis", label: "Player analysis" },
  { id: "training", label: "Training" },
  { id: "scouting", label: "Scouting" },
  { id: "nutrition", label: "Nutrition & recovery" },
];

export function SportProfileSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<SportProfileState>({
    role: "athlete",
    sport: [],
    team: "",
    league: "",
    focus: [],
  });

  const { user, login } = useAuth();
  const isAthlete = user?.role === "athlete";

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/onboarding/profile");
        if (!isMounted) return;

        setProfile({
          role: (data.role as Role) || "athlete",
          sport: Array.isArray(data.sport) ? data.sport : [],
          team: data.team || "",
          league: data.league || "",
          focus: Array.isArray(data.focus) ? data.focus : [],
        });
      } catch (error) {
        console.error("Failed to fetch sport profile:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleValue = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        role: profile.role,
        sport: profile.sport,
        team: profile.team.trim() || null,
        league: profile.league.trim() || null,
        focus: profile.focus,
      };

      await api.post("/onboarding/profile", payload);

      // Refresh authentication token to keep role / data synced globally
      try {
        const refreshRes = await api.post("/auth/refresh");
        login(refreshRes.data.access_token);
      } catch (e) {
        console.error("Token refresh sequence anomaly:", e);
      }

      toast.success("Profile Updated", {
        description: "Risbo will use this structure on your next request.",
      });
    } catch (error: any) {
      toast.error("Update Failed", {
        description:
          error.response?.data?.detail ||
          "A networking anomaly stopped state updates.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border/40 pb-4 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-end">
        <div>
          <h3 className="text-xl font-semibold text-foreground font-bricolage tracking-tight">
            Sport Profile
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Personalizes how Risbo analyzes and answers execution parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm shrink-0 w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Role Group */}
      <Section label="Role" hint="How Risbo frames its analytics loops.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ROLES.map((r) => {
            const disabled = isAthlete && r.id !== "athlete";

            return (
              <button
                key={r.id}
                disabled={disabled}
                className={`px-4 py-3 rounded-lg border text-xs md:text-sm font-medium transition-all ${
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : profile.role === r.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                      : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Sport Group */}
      <Section label="Sports" hint="Primary focus priorities.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SPORTS.map((s) => {
            const active = profile.sport.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setProfile((prev) => ({
                    ...prev,
                    sport: toggleValue(prev.sport, s.id),
                  }))
                }
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-xs md:text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                    : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                {s.label}
                {active && <Check size={15} />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Environmental Context Elements */}
      <Section label="Environment" hint="Your current organization layer data.">
        <div className="flex flex-col gap-3">
          <input
            value={profile.league}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, league: e.target.value }))
            }
            placeholder="League (e.g. Premier League)"
            className="w-full px-4 py-2.5 rounded-lg bg-accent/20 border border-border/60 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
          />

          <input
            value={profile.team}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, team: e.target.value }))
            }
            placeholder="Team (e.g. Arsenal)"
            className="w-full px-4 py-2.5 rounded-lg bg-accent/20 border border-border/60 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </Section>

      {/* Domain Vector Targets */}
      <Section label="Focus areas" hint="Specific tracking specializations.">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
          {FOCUS_OPTIONS.map((f) => {
            const active = profile.focus.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  setProfile((prev) => ({
                    ...prev,
                    focus: toggleValue(prev.focus, f.id),
                  }))
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm transition-all cursor-pointer font-medium ${
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                    : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                {active && <Check size={14} />}
                {f.label}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

const Section = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-0 select-none">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground ml-2">{hint}</span>
    </div>
    {children}
  </div>
);
