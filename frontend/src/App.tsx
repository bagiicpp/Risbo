import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import RegisterPage from "./pages/RegisterPage";
import AthleteDashboard from "./pages/AthleteDashboard";
import CoachOverview from "./pages/CoachOverview";
import RosterManagement from "./pages/RosterManagement";
import AthleteDetailView from "./pages/AthleteDetailView";
import { SettingsLayout } from "./pages/settings/SettingsLayout";
import { ProfileSettings } from "./pages/settings/ProfileSettings";
import { PreferencesSettings } from "./pages/settings/PreferencesSettings";
import { SportProfileSettings } from "./pages/settings/SportProfileSettings";
import OnboardingPage from "./pages/OnboardingPage";

import { Toaster } from "sonner";
import { useTheme } from "@/context/ThemeProvider";
import SmartKitchen from "./pages/SmartKitchen";

function App() {
  const { theme } = useTheme();

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/guest" element={<ChatPage />} />

          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="preferences" element={<PreferencesSettings />} />
            <Route path="sport" element={<SportProfileSettings />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/kitchen" element={<SmartKitchen />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["athlete"]} />}>
            <Route path="/profile" element={<AthleteDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["coach"]} />}>
            <Route path="/coach/dashboard" element={<CoachOverview />} />
            <Route path="/coach/roster" element={<RosterManagement />} />
            <Route path="/coach/athlete/:id" element={<AthleteDetailView />} />
          </Route>

          <Route path="/" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        theme={theme as "light" | "dark" | "system"}
      />
    </>
  );
}

export default App;
