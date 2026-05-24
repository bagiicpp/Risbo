import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { SettingsCard } from "@/components/common/SettingsCard";
import { SettingsInput } from "@/components/common/SettingsInput";
import { toast } from "sonner";
import api from "@/lib/api";

export function ProfileSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    target_weight: "",
    activity_multiplier: "",
  });

  // Hydrate form from the database on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/me");
        const data = response.data;

        setFormData({
          name: data.name || "",
          email: data.email || "",
          target_weight: data.target_weight?.toString() || "",
          activity_multiplier: data.activity_multiplier?.toString() || "1.55",
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        target_weight: formData.target_weight
          ? parseFloat(formData.target_weight)
          : null,
        activity_multiplier: formData.activity_multiplier
          ? parseFloat(formData.activity_multiplier)
          : null,
      };

      await api.patch("/profile", payload);

      toast.success("Profile Updated", {
        description: "Your foundational data has been successfully saved.",
      });
    } catch (error: any) {
      console.error("Failed to update profile:", error);

      toast.error("Update Failed", {
        description:
          error.response?.data?.detail ||
          "A network error occurred while saving.",
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
      <div className="border-b border-border/50 pb-4 flex justify-between items-end">
        <div>
          <h3 className="text-xl font-semibold text-foreground font-bricolage">
            User Profile
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your foundational biometric and account data.
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

      <SettingsCard
        title="Account Details"
        description="Your primary identity and contact information."
      >
        <div className="flex flex-col gap-4 w-full">
          <SettingsInput
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <SettingsInput
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            disabled
            className="bg-accent/30 cursor-not-allowed opacity-70"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Biometrics & Goals"
        description="Used by Risbo to calculate macros and training loads."
      >
        <div className="flex flex-col gap-4 w-full">
          <SettingsInput
            label="Target Bodyweight (kg)"
            name="target_weight"
            type="number"
            value={formData.target_weight}
            onChange={handleChange}
          />
          <SettingsInput
            label="Activity Multiplier"
            name="activity_multiplier"
            type="number"
            step="0.01"
            value={formData.activity_multiplier}
            onChange={handleChange}
          />
        </div>
      </SettingsCard>
    </div>
  );
}
