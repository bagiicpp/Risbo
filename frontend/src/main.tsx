import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeProvider.tsx";
import { ConversationProvider } from "@/context/ConversationProvider.tsx";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="risbo-theme">
      <AuthProvider>
        <ConversationProvider>
          <TooltipProvider delayDuration={0}>
            <App />
          </TooltipProvider>
        </ConversationProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
