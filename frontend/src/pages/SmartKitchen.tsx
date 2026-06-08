import { useState } from "react";
import { Zap, Archive } from "lucide-react";
import GeneratorView from "@/components/kitchen/GeneratorView";
import VaultView from "@/components/kitchen/VaultView";

type TabView = "generator" | "vault";

export default function SmartKitchen() {
  const [activeTab, setActiveTab] = useState<TabView>("generator");

  return (
    // Removed h-screen, w-full, font-dmsans, and bg-background.
    // Uses flex-1 and min-h-0 to safely inherit space from the MainLayout grid.
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 min-h-0 tracking-normal pt-16">
      {/* Navigation & Header Controls */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bricolage tracking-tight">
              Smart Kitchen
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm max-w-2xl">
              Manage your active inventory and generate macro-optimized
              protocols.
            </p>
          </div>

          {/* Tab Switcher Layout Component */}
          <div className="flex bg-accent/30 border border-border/50 rounded-lg p-1 shrink-0 h-10 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "generator"
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Zap size={14} />
              Generator
            </button>
            <button
              onClick={() => setActiveTab("vault")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "vault"
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Archive size={14} />
              Vault
            </button>
          </div>
        </div>
      </div>

      {/*
        Dynamic Workspace Mount
        We pass min-h-0 and flex-1 down so the active view can control its inner scrolling containers safely.
      */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {activeTab === "generator" ? <GeneratorView /> : <VaultView />}
      </div>
    </div>
  );
}
