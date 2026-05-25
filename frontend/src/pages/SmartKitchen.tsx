import { useState } from "react";
import { ArrowLeft, Zap, Archive } from "lucide-react";
import { useNavigate } from "react-router";
import GeneratorView from "@/components/kitchen/GeneratorView";
import VaultView from "@/components/kitchen/VaultView";

type TabView = "generator" | "vault";

export default function SmartKitchen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabView>("generator");

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-dmsans">
      <main className="flex-1 flex flex-col p-6 lg:p-10 h-full overflow-hidden">
        {/* Navigation & Header */}
        <div className="shrink-0 mb-6">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center cursor-pointer gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 px-2 py-1.5 -ml-2 rounded-md transition-colors w-fit mb-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft size={16} />
            Home
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-bricolage tracking-tight">
                Smart Kitchen
              </h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
                Manage your active inventory and generate macro-optimized
                protocols.
              </p>
            </div>

            {/* Industrial Tab Switcher */}
            <div className="flex bg-accent/30 border border-border/50 rounded-lg p-1 shrink-0 h-10 shadow-sm">
              <button
                onClick={() => setActiveTab("generator")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
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
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
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

        {/* Dynamic Workspace Mount */}
        {activeTab === "generator" ? <GeneratorView /> : <VaultView />}
      </main>
    </div>
  );
}
