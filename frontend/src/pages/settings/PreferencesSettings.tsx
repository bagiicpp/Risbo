import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { SettingsCard } from "@/components/common/SettingsCard";
import { toast } from "sonner";
import api from "@/lib/api";

export function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. ADD THEME TO LOCAL DRAFT STATE
  // We initialize it with the global theme as a fallback before the DB loads
  const [prefs, setPrefs] = useState({
    theme: theme,
    measurement_system: "metric",
    dietary_preference: "none",
    workout_reminders: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await api.get("/users/me");
        const userPrefs = response.data.preferences || {};

        // 2. HYDRATE LOCAL STATE WITH DB DATA
        setPrefs({
          theme: userPrefs.theme || "system",
          measurement_system: userPrefs.measurement_system || "metric",
          dietary_preference: userPrefs.dietary_preference || "none",
          workout_reminders: userPrefs.workout_reminders ?? true,
        });

        // Ensure the global app theme matches the DB on initial load
        if (userPrefs.theme && userPrefs.theme !== theme) {
          setTheme(userPrefs.theme as "light" | "dark" | "system");
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPrefs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleToggle = (key: string) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  // 3. NEW HANDLER FOR LOCAL THEME DRAFTING
  const handleThemeSelect = (selectedTheme: string) => {
    setPrefs((prev) => ({ ...prev, theme: selectedTheme }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Send the entire drafted prefs object to the backend
      await api.patch("/preferences", prefs);

      // 4. COMMIT TO GLOBAL CONTEXT ONLY AFTER SUCCESSFUL API CALL
      if (prefs.theme !== theme) {
        setTheme(prefs.theme as "light" | "dark" | "system");
      }

      toast.success("Preferences Saved", {
        description: "System behavior and aesthetic settings updated.",
      });
    } catch (error: any) {
      console.error("Failed to update preferences:", error);

      toast.error("Configuration Error", {
        description:
          error.response?.data?.detail ||
          "Failed to sync preferences with the server.",
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
      {/* Header */}
      <div className="border-b border-border/50 pb-5 flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-semibold text-foreground font-bricolage tracking-tight">
            App Preferences
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5">
            Adjust system behavior, aesthetics, and localization defaults.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-0 flex flex-col">
        {/* 5. BIND UI TO LOCAL DRAFT STATE, NOT GLOBAL CONTEXT */}
        <SettingsCard
          title="Interface Theme"
          description="Select or customize your UI theme."
        >
          <div className="flex bg-accent/30 p-1 rounded-lg w-fit border border-border/50 shadow-sm">
            <ThemeButton
              active={prefs.theme === "light"}
              onClick={() => handleThemeSelect("light")}
              label="Light"
            />
            <ThemeButton
              active={prefs.theme === "dark"}
              onClick={() => handleThemeSelect("dark")}
              label="Dark"
            />
            <ThemeButton
              active={prefs.theme === "system"}
              onClick={() => handleThemeSelect("system")}
              label="System"
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Measurement System"
          description="Used for generating Smart Kitchen recipes and charting biometrics."
        >
          <select
            name="measurement_system"
            value={prefs.measurement_system}
            onChange={handleChange}
            className="bg-background border border-border/60 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-sm w-48 text-foreground hover:border-border cursor-pointer"
          >
            <option value="metric">Metric (kg, cm, ml)</option>
            <option value="imperial">Imperial (lbs, in, oz)</option>
          </select>
        </SettingsCard>


      </div>
    </div>
  );
}

const ThemeButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 text-sm rounded-md transition-all font-medium cursor-pointer ${
      active
        ? "bg-background shadow-sm text-foreground border border-border/50"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {label}
  </button>
);
