import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  Dumbbell,
  Telescope,
  BarChart3,
  Trophy,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Role = "coach" | "athlete" | "scout" | "analyst";
type Sport = "football" | "basketball";

const ROLES: {
  id: Role;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "coach",
    label: "Coach",
    desc: "Team management & roster analysis",
    icon: <Users size={22} />,
  },
  {
    id: "athlete",
    label: "Athlete",
    desc: "Personal training & recovery",
    icon: <Dumbbell size={22} />,
  },
  {
    id: "scout",
    label: "Scout",
    desc: "Player profiling & prospects",
    icon: <Telescope size={22} />,
  },
  {
    id: "analyst",
    label: "Analyst",
    desc: "Advanced stats & data",
    icon: <BarChart3 size={22} />,
  },
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

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setOnboardingComplete, login } = useAuth();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [role, setRole] = useState<Role>((user?.role as Role) || "athlete");
  const [sport, setSport] = useState<Sport[]>([]);
  const [team, setTeam] = useState("");
  const [league, setLeague] = useState("");
  const [focus, setFocus] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/onboarding/profile");
        const data = res.data;
        if (data) {
          setRole(data.role || "athlete");
          setSport(data.sport || []);
          setTeam(data.team || "");
          setLeague(data.league || "");
          setFocus(data.focus || []);
        }
      } catch (error) {
        console.error("Failed to load existing onboarding profile", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProfile();
  }, []);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const submit = async () => {
    setIsSaving(true);
    try {
      await api.post("/onboarding/profile", {
        role,
        sport,
        team: team.trim() || null,
        league: league.trim() || null,
        focus,
      });
      setOnboardingComplete(true);
      
      try {
        const refreshRes = await api.post("/auth/refresh");
        login(refreshRes.data.access_token);
      } catch (e) {
        console.error("Token refresh failed", e);
      }

      toast.success("You're all set!", {
        description: "Risbo is now tailored to your profile.",
      });
      navigate("/chat");
    } catch (error: any) {
      toast.error("Could not save profile", {
        description:
          error.response?.data?.detail || "A network error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  if (isLoadingData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground font-dmsans px-4">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </span>
            <button
              onClick={submit}
              disabled={isSaving}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
          <div className="h-1.5 w-full rounded-full bg-accent overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1 — Role */}
        {step === 1 && (
          <StepShell
            title="Who are you?"
            subtitle="This shapes how Risbo talks to you."
          >
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-start gap-3 p-5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === r.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 hover:border-border hover:bg-accent/40"
                  }`}
                >
                  <span
                    className={
                      role === r.id ? "text-primary" : "text-muted-foreground"
                    }
                  >
                    {r.icon}
                  </span>
                  <div>
                    <div className="font-semibold font-bricolage">
                      {r.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {r.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {/* Step 2 — Sport */}
        {step === 2 && (
          <StepShell
            title="What do you follow?"
            subtitle="Pick one or both — Risbo will prioritize them."
          >
            <div className="grid grid-cols-2 gap-3">
              {SPORTS.map((s) => {
                const active = sport.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSport((prev) => toggle(prev, s.id))}
                    className={`flex items-center justify-center gap-2 p-6 rounded-xl border font-semibold font-bricolage transition-all cursor-pointer ${
                      active
                        ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                        : "border-border/60 hover:border-border hover:bg-accent/40"
                    }`}
                  >
                    <Trophy size={18} />
                    {s.label}
                    {active && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* Step 3 — League & Team */}
        {step === 3 && (
          <StepShell
            title="Your environment"
            subtitle="Optional — helps Risbo reference your specific context."
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  League
                </label>
                <input
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  placeholder="e.g. Premier League, EuroLeague"
                  className="w-full px-4 py-2.5 rounded-lg bg-accent/30 border border-border/60 outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Team
                </label>
                <input
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g. Arsenal, Real Madrid"
                  className="w-full px-4 py-2.5 rounded-lg bg-accent/30 border border-border/60 outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                />
              </div>
            </div>
          </StepShell>
        )}

        {/* Step 4 — Focus */}
        {step === 4 && (
          <StepShell
            title="What matters most?"
            subtitle="Select everything that's relevant to you."
          >
            <div className="flex flex-col gap-2.5">
              {FOCUS_OPTIONS.map((f) => {
                const active = focus.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => setFocus((prev) => toggle(prev, f.id))}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border/60 hover:border-border hover:bg-accent/40"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        active
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {active && <Check size={13} />}
                    </span>
                    <span className="font-medium">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={back}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-0"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {isSaving ? "Saving..." : "Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const StepShell = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    <h1 className="text-2xl font-semibold font-bricolage mb-1.5">{title}</h1>
    <p className="text-sm text-muted-foreground mb-7">{subtitle}</p>
    {children}
  </div>
);
