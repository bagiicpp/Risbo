import { useState, useEffect } from "react";

import { Save, Loader2, Check } from "lucide-react";

import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

import api from "@/lib/api";

type Role = "coach" | "athlete" | "scout" | "analyst";

type Sport = "football" | "basketball";

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

  const [role, setRole] = useState<Role>("athlete");

  const [sport, setSport] = useState<Sport[]>([]);

  const [team, setTeam] = useState("");

  const [league, setLeague] = useState("");

  const [focus, setFocus] = useState<string[]>([]);

  const { user, login } = useAuth();

  const isAthlete = user?.role === "athlete";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/onboarding/profile");

        setRole((data.role as Role) || "athlete");

        setSport(Array.isArray(data.sport) ? data.sport : []);

        setTeam(data.team || "");

        setLeague(data.league || "");

        setFocus(Array.isArray(data.focus) ? data.focus : []);
      } catch (error) {
        console.error("Failed to fetch sport profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await api.post("/onboarding/profile", {
        role,

        sport,

        team: team.trim() || null,

        league: league.trim() || null,

        focus,
      });

      try {
        const refreshRes = await api.post("/auth/refresh");

        login(refreshRes.data.access_token);
      } catch (e) {
        console.error("Token refresh failed", e);
      }

      toast.success("Profile Updated", {
        description: "Risbo will use this on your next message.",
      });
    } catch (error: any) {
      toast.error("Update Failed", {
        description:
          error.response?.data?.detail || "A network error occurred.",
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
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-border/50 pb-4 flex justify-between items-end">
        <div>
          <h3 className="text-xl font-semibold text-foreground font-bricolage">
            Sport Profile
          </h3>

          <p className="text-sm text-muted-foreground mt-1">
            Personalizes how Risbo analyzes and answers for you.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}

          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Role */}

      <Section label="Role" hint="How Risbo frames its responses.">
        <div className="grid grid-cols-2 gap-2.5">
          {ROLES.filter((r) =>
            isAthlete ? r.id === "athlete" : r.id !== "athlete",
          ).map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                role === r.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                  : "border-border/60 hover:border-border hover:bg-accent/40"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Sport */}

      <Section label="Sports" hint="Which sports to prioritize.">
        <div className="grid grid-cols-2 gap-2.5">
          {SPORTS.map((s) => {
            const active = sport.includes(s.id);

            return (
              <button
                key={s.id}
                onClick={() => setSport((prev) => toggle(prev, s.id))}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                    : "border-border/60 hover:border-border hover:bg-accent/40"
                }`}
              >
                {s.label}

                {active && <Check size={15} />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* League & Team */}

      <Section label="Environment" hint="Your specific league and team.">
        <div className="flex flex-col gap-3">
          <input
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            placeholder="League (e.g. Premier League)"
            className="w-full px-4 py-2.5 rounded-lg bg-accent/30 border border-border/60 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
          />

          <input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="Team (e.g. Arsenal)"
            className="w-full px-4 py-2.5 rounded-lg bg-accent/30 border border-border/60 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
          />
        </div>
      </Section>

      {/* Focus */}

      <Section label="Focus areas" hint="Topics to emphasize.">
        <div className="flex flex-wrap gap-2.5">
          {FOCUS_OPTIONS.map((f) => {
            const active = focus.includes(f.id);

            return (
              <button
                key={f.id}
                onClick={() => setFocus((prev) => toggle(prev, f.id))}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                    : "border-border/60 hover:border-border hover:bg-accent/40"
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
    <div>
      <span className="text-sm font-semibold text-foreground">{label}</span>

      <span className="text-xs text-muted-foreground ml-2">{hint}</span>
    </div>

    {children}
  </div>
);
