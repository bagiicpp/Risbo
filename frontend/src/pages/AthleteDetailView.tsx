import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  Target,
  Scale,
  Trophy,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import api from "@/lib/api";

// Map backend categories to specific Lucide icons
const categoryIcons: Record<string, any> = {
  body_stats: Scale,
  pr: Trophy,
  goal: Target,
  general: Activity,
};

export default function AthleteDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [athleteMeta, setAthleteMeta] = useState<any>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<Record<string, any>>({});
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Loading & Error States
  const [pageLoading, setPageLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Page Load: Fetch Metadata & Summary
  useEffect(() => {
    const fetchAthleteContext = async () => {
      try {
        setPageLoading(true);
        setError(null);

        // Fetch the roster and the aggregated summaries concurrently
        const [rosterRes, summaryRes] = await Promise.all([
          api.get("/roster/athletes"),
          api.get("/coach/metrics/summary"),
        ]);

        const rosterData = rosterRes.data;
        const summaryData = summaryRes.data;

        // Find this specific athlete
        const meta = rosterData.find((a: any) => a.id === id);
        if (!meta) {
          throw new Error("404"); // Not found in roster
        }
        setAthleteMeta(meta);

        // Find their metrics summary
        const athleteSummaryObj = summaryData.find(
          (s: any) => s.athlete_id === id,
        );

        if (athleteSummaryObj && athleteSummaryObj.metrics) {
          setSummaryMetrics(athleteSummaryObj.metrics);

          // Auto-select the first numeric metric for the chart
          const numericMetrics = Object.entries(
            athleteSummaryObj.metrics,
          ).filter(
            ([_, data]: [string, any]) => typeof data.value === "number" || !isNaN(parseFloat(data.value)),
          );
          if (numericMetrics.length > 0) {
            setActiveMetric(numericMetrics[0][0]);
          }
        }
      } catch (err: any) {
        if (err.message === "404" || err.response?.status === 403) {
          setError("Access Denied: This athlete is not on your roster.");
        } else {
          setError("Failed to load athlete telemetry data.");
        }
      } finally {
        setPageLoading(false);
      }
    };

    if (id) fetchAthleteContext();
  }, [id]);

  // 2. Secondary Fetch: Load Time-Series Data when Active Metric Changes
  useEffect(() => {
    const fetchChartData = async () => {
      if (!activeMetric || !id) return;

      try {
        setChartLoading(true);
        const res = await api.get(
          `/coach/metrics/${id}?metric_name=${activeMetric}`,
        );

        const formattedData = res.data
          .filter((item: any) => typeof item.value === "number" || !isNaN(parseFloat(item.value)))
          .map((item: any) => ({
            ...item,
            displayDate: format(parseISO(item.date), "MMM d"),
          }));

        setChartData(formattedData);
      } catch (err) {
        console.error("Failed to fetch time series:", err);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [activeMetric, id]);

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-destructive font-dmsans p-4 text-center">
        <AlertCircle size={48} className="mb-4 opacity-80" />
        <h2 className="text-2xl font-bold font-bricolage mb-2">
          Unauthorized Access
        </h2>
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={() => navigate("/coach/roster")}
          className="mt-6 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
        >
          Return to Roster
        </button>
      </div>
    );
  }

  return (
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Navigation & Header */}
            <div className="space-y-4">
              <button
                onClick={() => navigate("/coach/roster")}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft size={16} className="mr-1.5" /> Back to Roster
              </button>

              {pageLoading ? (
                <div className="h-10 w-64 bg-border/40 rounded-lg animate-pulse" />
              ) : (
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bricolage font-bold text-foreground tracking-tight">
                      {athleteMeta?.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 font-mono text-sm">
                      {athleteMeta?.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      athleteMeta?.status === "active"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    }`}
                  >
                    {athleteMeta?.status}
                  </span>
                </div>
              )}
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pageLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl bg-border/20 border border-border/50 animate-pulse"
                  />
                ))
              ) : Object.keys(summaryMetrics).length === 0 ? (
                <div className="col-span-3 p-8 border border-dashed border-border/50 rounded-2xl text-center text-muted-foreground">
                  No metric telemetry logged by this athlete yet.
                </div>
              ) : (
                <AnimatePresence>
                  {Object.entries(summaryMetrics).map(
                    ([metricName, data]: [string, any], index) => {
                      const Icon = categoryIcons[data.category] || Activity;
                      return (
                        <motion.div
                          key={metricName}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm flex flex-col justify-between"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                              <Icon size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                {metricName.replace("_", " ")}
                              </p>
                              <h3 className="text-xl font-bold text-foreground mt-1 truncate">
                                {data.value} {data.unit}
                              </h3>
                            </div>
                          </div>
                        </motion.div>
                      );
                    },
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Interactive Charting Area */}
            {Object.keys(summaryMetrics).length > 0 && (
              <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    <h2 className="text-xl font-bold text-foreground">
                      Time Series Analytics
                    </h2>
                  </div>

                  <select
                    value={activeMetric || ""}
                    onChange={(e) => setActiveMetric(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/50 text-foreground font-medium"
                  >
                    {Object.entries(summaryMetrics)
                      .filter(
                        ([_, data]: [string, any]) =>
                          typeof data.value === "number" || !isNaN(parseFloat(data.value)),
                      )
                      .map(([key, _]) => (
                        <option key={key} value={key}>
                          {key.replace("_", " ").toUpperCase()}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="h-[350px] w-full relative">
                  <AnimatePresence mode="wait">
                    {chartLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10 rounded-xl border border-border/20"
                      >
                        <Activity
                          className="animate-pulse text-primary opacity-50"
                          size={32}
                        />
                      </motion.div>
                    ) : chartData.length > 0 ? (
                      <motion.div
                        key={activeMetric} // This forces framer-motion to transition when metric changes
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="text-border opacity-50"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="displayDate"
                              stroke="currentColor"
                              className="text-muted-foreground text-xs"
                              tickLine={false}
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              stroke="currentColor"
                              className="text-muted-foreground text-xs"
                              tickLine={false}
                              axisLine={false}
                              dx={-10}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                borderRadius: "0.75rem",
                              }}
                              itemStyle={{
                                color: "hsl(var(--foreground))",
                                fontWeight: "bold",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="var(--color-risbo-green-500, #10b981)"
                              strokeWidth={3}
                              dot={{
                                r: chartData.length === 1 ? 6 : 4,
                                fill: "var(--background)",
                                stroke: "var(--color-risbo-green-500, #10b981)",
                                strokeWidth: 2,
                              }}
                              activeDot={{
                                r: 6,
                                fill: "var(--color-risbo-green-600, #059669)",
                                stroke: "var(--background)",
                              }}
                              isAnimationActive={true}
                              connectNulls={true}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </motion.div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl">
                        No data logged for this metric yet.
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </main>

  );
}
