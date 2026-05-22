import { useEffect, useState } from "react";
import { Users, TrendingUp, Activity, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/AppSidebar";

interface KPIStats {
  totalAthletes: number;
  activeThisWeek: number;
  goalsAchieved: number;
}

export default function CoachOverview() {
  const [stats, setStats] = useState<KPIStats>({
    totalAthletes: 0,
    activeThisWeek: 0,
    goalsAchieved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const [rosterRes, metricsRes] = await Promise.all([
          api.get("/roster/athletes"),
          api.get("/coach/metrics/summary"),
        ]);

        const athletes = rosterRes.data;
        const metrics = metricsRes.data;

        const recentActivityThreshold = new Date();
        recentActivityThreshold.setDate(recentActivityThreshold.getDate() - 7);

        let activeCount = 0;
        let goalsMet = 0;

        metrics.forEach((m: any) => {
          const hasRecentData = Object.values(m.metrics).some(
            (val: any) => new Date(val.date) > recentActivityThreshold,
          );
          if (hasRecentData) activeCount++;

          if (m.metrics.pr) goalsMet++;
        });

        setStats({
          totalAthletes: athletes.length,
          activeThisWeek: activeCount,
          goalsAchieved: goalsMet,
        });
      } catch (error) {
        console.error("Failed to aggregate KPIs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-background font-dmsans">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full relative overflow-hidden bg-background">
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bricolage font-bold text-foreground tracking-tight">
                Command Center
              </h1>
              <p className="text-muted-foreground mt-1">
                Aggregate performance analytics across all your rosters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Headcount Card */}
              <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Users size={24} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground">
                  {loading ? "--" : stats.totalAthletes}
                </h3>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
                  Total Athletes
                </p>
              </div>

              {/* Engagement Card */}
              <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <Activity size={24} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground">
                  {loading ? "--" : stats.activeThisWeek}
                </h3>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
                  Active This Week
                </p>
              </div>

              {/* Progress Card */}
              <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground">
                  {loading ? "--" : stats.goalsAchieved}
                </h3>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
                  Recent PRs Logged
                </p>
              </div>
            </div>

            {/* Placeholder for future cross-team charts */}
            <div className="w-full h-96 rounded-2xl border border-border/50 bg-card flex flex-col items-center justify-center text-muted-foreground border-dashed">
              <AlertCircle size={32} className="mb-2 opacity-50" />
              <p>Cross-team performance visualizations will populate here.</p>
              <p className="text-sm mt-1">
                Requires backend aggregation pipeline deployment.
              </p>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
