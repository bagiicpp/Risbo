import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import RegisterPage from "./pages/RegisterPage";
import AthleteDashboard from "./pages/AthleteDashboard";
import CoachOverview from "./pages/CoachOverview";
import RosterManagement from "./pages/RosterManagement";
import AthleteDetailView from "./pages/AthleteDetailView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["athlete"]} />}>
          <Route path="/profile" element={<AthleteDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["coach"]} />}>
          <Route path="/coach/dashboard" element={<CoachOverview />} />
          <Route path="/coach/roster" element={<RosterManagement />} />
          <Route path="/coach/athlete/:id" element={<AthleteDetailView />} />
        </Route>

        <Route path="/" element={<ProtectedRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
