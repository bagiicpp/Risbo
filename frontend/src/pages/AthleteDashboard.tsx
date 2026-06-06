import { useEffect, useState } from "react";
import { getProfileSummary, getProfileMetrics } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Target,
  Scale,
  Activity,
  TrendingUp,
  Loader2,
  Trophy,
  Utensils,
  Calendar,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Dynamically assign icons based on the category AI assigns
const categoryIcons: Record<string, any> = {
  body_stats: Scale,
  pr: Trophy,
  goal: Target,
  diet: Utensils,
  training_data: Activity,
  general: Activity,
};

export default function ProfilePage() {
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeChartMetric, setActiveChartMetric] = useState<string>("weight");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const summaryData = await getProfileSummary();
        setSummary(summaryData);

        const availableMetrics = Object.keys(summaryData);
        if (availableMetrics.length > 0 && !summaryData["weight"]) {
          setActiveChartMetric(availableMetrics[0]);
        }
      } catch (error) {
        console.error("Failed to load profile summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  useEffect(() => {
    const fetchChart = async () => {
      if (!activeChartMetric) return;
      try {
        const data = await getProfileMetrics(activeChartMetric);

        const formattedData = data
          .map((item: any) => ({
            ...item,
            // 1. Attempt to cast the string to a float
            parsedValue: parseFloat(item.value),
            displayDate: format(parseISO(item.date), "MMM d, HH:mm"),
          }))
          // 2. Filter out anything that resulted in NaN (e.g., text goals)
          .filter((item: any) => !isNaN(item.parsedValue))
          // 3. Overwrite the original value with the strict number for Recharts
          .map((item: any) => ({
            ...item,
            value: item.parsedValue,
          }));

        setChartData(formattedData);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      }
    };
    fetchChart();
  }, [activeChartMetric]);

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bricolage font-bold text-foreground tracking-tight">
              Athlete Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Your automatically extracted insights from chats with Risbo.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(summary).map(
                  ([metricName, data]: [string, any]) => {
                    const Icon = categoryIcons[data.category] || Activity;

                    return (
                      <div
                        key={metricName}
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

                        {data.meta_data &&
                          Object.keys(data.meta_data).length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground flex gap-3">
                              {data.meta_data.deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />{" "}
                                  {data.meta_data.deadline}
                                </span>
                              )}
                              {data.meta_data.sport && (
                                <span className="capitalize text-primary font-medium">
                                  {data.meta_data.sport}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  },
                )}

                {Object.keys(summary).length === 0 && (
                  <p className="col-span-3 text-muted-foreground p-4 text-center border rounded-xl border-dashed">
                    No metrics logged yet. Tell Risbo your PRs, diet goals, or
                    training plans!
                  </p>
                )}
              </div>

              {Object.keys(summary).length > 0 && (
                <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-primary" size={20} />
                      <h2 className="text-xl font-bold text-foreground">
                        Progress Tracker
                      </h2>
                    </div>

                    <select
                      value={activeChartMetric}
                      onChange={(e) => setActiveChartMetric(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Object.entries(summary)
                        .filter(
                          ([_, data]: [string, any]) =>
                            !isNaN(parseFloat(data.value)),
                        )
                        .map(([key, _]) => (
                          <option key={key} value={key}>
                            {key.replace("_", " ").toUpperCase()}
                          </option>
                        ))}
                    </select>
                  </div>

                  {chartData.length > 0 ? (
                    <div className="h-[350px] w-full">
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
                            // Safe CSS variable injection for Recharts
                            stroke="var(--color-risbo-green-500, #10b981)"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              fill: "var(--background)",
                              stroke: "var(--color-risbo-green-500, #10b981)",
                              strokeWidth: 2,
                            }}
                            activeDot={{
                              r: 6,
                              fill: "var(--color-risbo-green-600, #059669)",
                              stroke: "var(--background)",
                            }}
                            isAnimationActive={true} // You can safely turn this back on now!
                            connectNulls={true}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                      Not enough numeric data points to chart this metric yet.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
