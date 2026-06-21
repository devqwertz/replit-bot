import { useQuery } from "@tanstack/react-query";
import {
  useGetAnalyticsOverview,
  useGetExecutionChart,
  useGetTopScripts,
  useGetRecentActivity
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Shield, Zap, FileCode2, CheckCircle2, XCircle, Globe, Trophy } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import React, { useRef, useState } from "react";

const GEO_URL = "https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson";

const RANK_COLORS = [
  "#2563eb", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6",
  "#10d9a0", "#22c55e", "#84cc16", "#f59e0b", "#f97316",
];

interface TopExecutor {
  executorId: string;
  robloxUsername: string | null;
  robloxClientId: string | null;
  robloxThumbnailUrl: string | null;
  executions: number;
  successCount: number;
}

interface TopCountry {
  country: string;
  countryCode: string;
  executions: number;
}

interface MapTooltip {
  country: string;
  executions: number;
  rank: number;
  x: number;
  y: number;
}

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalyticsOverview();
  const { data: chartData, isLoading: chartLoading } = useGetExecutionChart();
  const { data: topScripts, isLoading: topScriptsLoading } = useGetTopScripts();
  const { data: recentActivity, isLoading: recentActivityLoading } = useGetRecentActivity();
  const mapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null);

  const { data: topExecutors = [], isLoading: executorsLoading } = useQuery<TopExecutor[]>({
    queryKey: ["/api/analytics/top-executors"],
    queryFn: async () => {
      const r = await fetch("/api/analytics/top-executors");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: topCountries = [] } = useQuery<TopCountry[]>({
    queryKey: ["/api/analytics/top-countries"],
    queryFn: async () => {
      const r = await fetch("/api/analytics/top-countries");
      if (!r.ok) return [];
      return r.json();
    },
  });

  // Build lookup: ISO A2 code → { rank, color, country, executions }
  const countryColorMap = React.useMemo(() => {
    const m: Record<string, { rank: number; color: string; country: string; executions: number }> = {};
    topCountries.slice(0, 10).forEach((c, i) => {
      // ip-api returns 2-letter codes; normalise to uppercase
      const code = (c.countryCode ?? "").toUpperCase().trim();
      if (code && code !== "XX") {
        m[code] = { rank: i, color: RANK_COLORS[i], country: c.country, executions: c.executions };
      }
    });
    return m;
  }, [topCountries]);

  const handleGeoMouseEnter = (entry: { rank: number; color: string; country: string; executions: number } | undefined, e: React.MouseEvent) => {
    if (!entry || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    setTooltip({
      country: entry.country,
      executions: entry.executions,
      rank: entry.rank,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleGeoMouseMove = (e: React.MouseEvent) => {
    if (!tooltip || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Monitor your scripts performance and execution metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Executions" value={analytics?.totalExecutions.toLocaleString()} icon={<Zap className="w-4 h-4 text-primary" />} loading={analyticsLoading} />
        <StatCard title="Active Users"      value={analytics?.activeUsers.toLocaleString()}     icon={<Users className="w-4 h-4 text-primary" />}    loading={analyticsLoading} />
        <StatCard title="Success Rate"      value={analytics ? `${analytics.successRate.toFixed(1)}%` : undefined} icon={<Activity className="w-4 h-4 text-green-500" />} loading={analyticsLoading} />
        <StatCard title="Protected"         value={analytics ? `${analytics.obfuscatedScripts} / ${analytics.activeScripts}` : undefined} icon={<Shield className="w-4 h-4 text-indigo-400" />} loading={analyticsLoading} />
      </div>

      {/* Chart */}
      <Card className="border-white/5 shadow-none bg-card/50">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Executions Overview</CardTitle>
          <CardDescription className="text-xs md:text-sm">Execution volume over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] md:h-[280px] w-full">
            {chartLoading ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(val) => format(new Date(val), 'MMM dd')} minTickGap={40} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} width={40} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelFormatter={(val) => format(new Date(val), 'MMM dd, yyyy')} />
                  <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md border-border">
                No execution data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Top Scripts */}
        <Card className="border-white/5 shadow-none bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-muted-foreground" />
              Top Scripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topScriptsLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : topScripts && topScripts.length > 0 ? (
              <div className="space-y-1">
                {topScripts.slice(0, 5).map((script, i) => (
                  <Link key={script.id} href={`/scripts/${script.id}`} className="flex items-center gap-3 p-2.5 md:p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <span className="text-xs font-bold text-muted-foreground/40 w-5 shrink-0">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium font-mono text-xs md:text-sm truncate">{script.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{script.service || 'No service'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium text-sm">{script.executions.toLocaleString()}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">execs</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No active scripts yet</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-white/5 shadow-none bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivityLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-2.5 md:p-3 rounded-md border border-white/5 bg-background/50">
                    <div className="shrink-0">
                      {log.status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium font-mono text-xs md:text-sm truncate">{log.scriptName}</div>
                      <div className="text-[11px] text-muted-foreground truncate">ID: {log.executorId}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground shrink-0 text-right">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      {log.duration && <div className="mt-0.5">{log.duration}ms</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No recent executions</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Executors */}
      <Card className="border-white/5 shadow-none bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top Executors
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Users with the most script executions</CardDescription>
        </CardHeader>
        <CardContent>
          {executorsLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : topExecutors.length > 0 ? (
            <div className="space-y-2">
              {topExecutors.map((ex, i) => {
                const rate = ex.executions > 0 ? Math.round((ex.successCount / ex.executions) * 100) : 0;
                return (
                  <div key={ex.executorId} className="flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-md border border-white/5 bg-background/30 hover:bg-white/[0.02] transition-colors">
                    <span className="text-sm font-bold text-muted-foreground/40 w-5 shrink-0 text-center">#{i+1}</span>
                    {ex.robloxThumbnailUrl ? (
                      <img src={ex.robloxThumbnailUrl} alt="" className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/10 object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/10 bg-white/5 shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                        {(ex.robloxUsername ?? ex.executorId).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {ex.robloxUsername ?? <span className="text-muted-foreground font-mono text-xs">{ex.executorId}</span>}
                      </div>
                      {ex.robloxClientId && (
                        <div className="text-[10px] text-muted-foreground/50 font-mono truncate mt-0.5">CID: {ex.robloxClientId}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="font-semibold text-sm font-mono">{ex.executions.toLocaleString()}</div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 ${rate >= 80 ? 'border-green-500/30 text-green-400' : rate >= 50 ? 'border-amber-500/30 text-amber-400' : 'border-red-500/30 text-red-400'}`}>
                        {rate}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No executor data yet — executions will appear here once scripts are loaded.
            </div>
          )}
        </CardContent>
      </Card>

      {/* World Map */}
      <Card className="border-white/5 shadow-none bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            Execution Geography
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Top 10 countries by execution count</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Map */}
          <div
            ref={mapRef}
            className="h-[220px] md:h-[360px] w-full rounded-md overflow-hidden bg-[#060b18] relative"
            onMouseLeave={() => setTooltip(null)}
          >
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 130, center: [10, 20] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    const iso2 = (geo.properties.ISO_A2 ?? geo.properties.iso_a2 ?? "").toUpperCase().trim();
                    const entry = countryColorMap[iso2];
                    const isTop = !!entry;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isTop ? entry.color : "rgba(255,255,255,0.04)"}
                        stroke={isTop ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)"}
                        strokeWidth={isTop ? 0.8 : 0.3}
                        onMouseEnter={(e: React.MouseEvent) => handleGeoMouseEnter(entry, e)}
                        onMouseMove={(e: React.MouseEvent) => handleGeoMouseMove(e)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          default: { outline: "none" },
                          hover: {
                            outline: "none",
                            fill: isTop ? entry.color : "rgba(255,255,255,0.08)",
                            filter: isTop ? "brightness(1.35) saturate(1.2)" : "none",
                            cursor: isTop ? "pointer" : "default",
                          },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>

            {/* Hover tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-card/95 border border-border shadow-xl text-xs backdrop-blur-sm"
                style={{
                  left: Math.min(tooltip.x + 12, (mapRef.current?.clientWidth ?? 400) - 160),
                  top: Math.max(tooltip.y - 48, 8),
                }}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: RANK_COLORS[tooltip.rank] }}
                  />
                  #{tooltip.rank + 1} {tooltip.country}
                </div>
                <div className="text-muted-foreground">{tooltip.executions.toLocaleString()} executions</div>
              </div>
            )}

            {topCountries.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none px-4 text-center">
                No country data yet — execute a script to see geography.
              </div>
            )}
          </div>

          {/* Legend */}
          {topCountries.length > 0 && (
            <div className="mt-3 md:mt-4 grid grid-cols-2 md:grid-cols-5 gap-1.5 md:gap-2">
              {topCountries.slice(0, 10).map((c, i) => (
                <div
                  key={c.countryCode}
                  className="flex items-center gap-1.5 text-xs p-2 rounded-md bg-white/[0.03] border border-white/5"
                  style={{ borderLeftColor: RANK_COLORS[i], borderLeftWidth: 2 }}
                >
                  <span className="text-muted-foreground/50 font-bold w-4 shrink-0 text-[10px]">#{i+1}</span>
                  <span className="font-medium truncate flex-1 text-[11px]">{c.country}</span>
                  <span className="text-muted-foreground font-mono shrink-0 text-[10px]">{c.executions.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string; value?: string; icon: React.ReactNode; loading: boolean }) {
  return (
    <Card className="border-white/5 shadow-none bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 pt-4 px-4 md:px-6">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-xl md:text-2xl font-bold">{value || '0'}</div>
        )}
      </CardContent>
    </Card>
  );
}
