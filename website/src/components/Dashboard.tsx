import React, { useEffect, useState } from "react";
import {
  Activity,
  Cpu,
  CircuitBoard,
  ServerCrash,
  Zap,
  Users,
  Clock,
  Rocket,
  Lock,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// --- Types ---

interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  ramTotal: string;
  ramUsed: string;
}

// Widget types
type WidgetType = "action" | "stat" | "toggle" | "redirectButton";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface DashboardWidget {
  id: string;
  type: WidgetType;
  label: string;

  // For 'stat' type
  value?: string | number;

  // For 'action' and 'toggle' types
  endpoint?: string;

  // For 'toggle' type
  toggleState?: boolean;

  // Visuals
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  icon?: string;

  // For 'redirectButton' type
  buttonText?: string;
  redirectUrl?: string;

  // ✅ Existing "info" API before redirect (kept as-is)
  apiEndpoint?: string;
  apiMethod?: HttpMethod;
  apiData?: any;

  // ✅ NEW: status API that returns { online: boolean }
  statusApiEndpoint?: string;
  statusApiMethod?: HttpMethod; // default: GET in code
}

// --- Glass themes ---

type GlassTheme = "indigo" | "emerald" | "rose" | "cyan" | "amber" | "violet";

const glassThemes: Record<
  GlassTheme,
  {
    bg: string;
    accent: string;
    glow: string;
    label: string;
    buttonRing: string;
  }
> = {
  indigo: {
    bg: "from-slate-900 via-slate-950 to-indigo-900",
    accent: "text-indigo-300",
    glow: "shadow-[0_0_40px_rgba(129,140,248,0.35)]",
    label: "Indigo Nebula",
    buttonRing:
      "ring-1 ring-indigo-400/40 shadow-[0_0_20px_rgba(129,140,248,0.5)]",
  },
  emerald: {
    bg: "from-slate-900 via-slate-950 to-emerald-900",
    accent: "text-emerald-300",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.35)]",
    label: "Emerald Core",
    buttonRing:
      "ring-1 ring-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
  },
  rose: {
    bg: "from-slate-900 via-slate-950 to-rose-900",
    accent: "text-rose-300",
    glow: "shadow-[0_0_40px_rgba(244,63,94,0.35)]",
    label: "Rose Horizon",
    buttonRing:
      "ring-1 ring-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.5)]",
  },
  cyan: {
    bg: "from-slate-900 via-slate-950 to-cyan-900",
    accent: "text-cyan-300",
    glow: "shadow-[0_0_40px_rgba(34,211,238,0.35)]",
    label: "Cyan Aurora",
    buttonRing:
      "ring-1 ring-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.5)]",
  },
  amber: {
    bg: "from-slate-900 via-slate-950 to-amber-900",
    accent: "text-amber-300",
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.35)]",
    label: "Amber Forge",
    buttonRing:
      "ring-1 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.5)]",
  },
  violet: {
    bg: "from-slate-900 via-slate-950 to-violet-900",
    accent: "text-violet-300",
    glow: "shadow-[0_0_40px_rgba(139,92,246,0.35)]",
    label: "Violet Pulse",
    buttonRing:
      "ring-1 ring-violet-400/40 shadow-[0_0_20px_rgba(139,92,246,0.5)]",
  },
};

// --- Icons Helper ---

const getIcon = (name?: string) => {
  switch (name) {
    case "rocket":
      return <Rocket className="mr-2 h-4 w-4" />;
    case "users":
      return <Users className="mr-2 h-4 w-4" />;
    case "clock":
      return <Clock className="mr-2 h-4 w-4" />;
    case "lock":
      return <Lock className="mr-2 h-4 w-4" />;
    case "warn":
      return <ServerCrash className="mr-2 h-4 w-4" />;
    case "flash":
      return <Zap className="mr-2 h-4 w-4" />;
    case "wifi":
      return <Wifi className="mr-2 h-4 w-4" />;
    default:
      return <Activity className="mr-2 h-4 w-4" />;
  }
};

// --- System Monitor Component ---

const SystemMonitor: React.FC<{ theme: GlassTheme }> = ({ theme }) => {
  const [data, setData] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/system");
        if (!res.ok) throw new Error("Failed to fetch system stats");
        const json = (await res.json()) as SystemStats;
        setData(json);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load system stats");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getCpuStatus = (value: number) => {
    if (value >= 85) return { label: "Critical", color: "text-rose-300 bg-rose-500/10 border-rose-500/30" };
    if (value >= 65) return { label: "High", color: "text-amber-300 bg-amber-500/10 border-amber-500/30" };
    if (value >= 35) return { label: "Moderate", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" };
    return { label: "Idle", color: "text-slate-300 bg-slate-500/10 border-slate-500/30" };
  };

  const getRamStatus = (value: number) => {
    if (value >= 85) return { label: "Near Capacity", color: "text-rose-300 bg-rose-500/10 border-rose-500/30" };
    if (value >= 70) return { label: "Busy", color: "text-amber-300 bg-amber-500/10 border-amber-500/30" };
    if (value >= 40) return { label: "Healthy", color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30" };
    return { label: "Plenty Free", color: "text-slate-300 bg-slate-500/10 border-slate-500/30" };
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <Card className={`group relative overflow-hidden border border-slate-800/80 bg-slate-950/90 ${glassThemes[theme].glow}`}>
      {/* Glowing edges - updated to use theme color */}
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-${theme}-400/60 to-transparent`} />
        <div className={`absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-${theme}-400/50 to-transparent`} />
        <div className="absolute -inset-32 bg-[radial-gradient(circle_at_top,_rgba(var(--theme-rgb),0.18),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(var(--theme-rgb),0.16),_transparent_60%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
             style={{
               ['--theme-rgb' as any]: getThemeColor(theme)
             }} />
      </div>
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
      <div className="relative">{children}</div>
    </Card>
  );

  // Helper function to get RGB values for each theme
  const getThemeColor = (theme: GlassTheme) => {
    switch (theme) {
      case 'indigo': return '129,140,248';
      case 'emerald': return '16,185,129';
      case 'rose': return '244,63,94';
      case 'cyan': return '34,211,238';
      case 'amber': return '245,158,11';
      case 'violet': return '139,92,246';
      default: return '16,185,129';
    }
  };

  if (loading) {
    return (
      <Shell>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
                <Cpu className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight text-slate-50">
                  System Monitor
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-300/75">
                  Live CPU & memory utilization
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Live
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Updating
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Top metrics skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
              <Skeleton className="mb-2 h-3 w-16 rounded bg-slate-700/70" />
              <Skeleton className="mb-1 h-5 w-14 rounded bg-slate-700/70" />
              <Skeleton className="h-2 w-full rounded-full bg-slate-700/70" />
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
              <Skeleton className="mb-2 h-3 w-20 rounded bg-slate-700/70" />
              <Skeleton className="mb-1 h-5 w-20 rounded bg-slate-700/70" />
              <Skeleton className="h-2 w-full rounded-full bg-slate-700/70" />
            </div>
          </div>

          {/* Bottom skeleton bars */}
          <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
            <Skeleton className="h-3 w-24 rounded bg-slate-700/70" />
            <Skeleton className="h-2 w-full rounded-full bg-slate-700/70" />
            <Skeleton className="h-2 w-[70%] rounded-full bg-slate-700/70" />
          </div>
        </CardContent>
      </Shell>
    );
  }

  if (!data) return null;

  const cpuStatus = getCpuStatus(data.cpuUsage);
  const ramStatus = getRamStatus(data.ramUsage);

  return (
    <Shell>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <Cpu className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-slate-50">
                System Monitor
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-300/75">
                Live CPU & memory utilization
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Live
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Refresh · 5s
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Top row: CPU + Memory cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* CPU card */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
                    <Activity className="h-3.5 w-3.5 text-emerald-300" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-slate-200/90">CPU Load</p>
                    <p className="text-[10px] text-slate-400">Processor utilization</p>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cpuStatus.color}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {cpuStatus.label}
                </div>
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold tabular-nums text-slate-50">
                    {data.cpuUsage.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400">% used</span>
                </div>
                <div className="flex flex-col items-end text-[10px] text-slate-400">
                  <span>0% · idle</span>
                  <span>100% · saturated</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Progress
                  value={data.cpuUsage}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Background services</span>
                  <span>Active workloads</span>
                </div>
              </div>
            </div>
          </div>

          {/* Memory card */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30">
                    <CircuitBoard className="h-3.5 w-3.5 text-cyan-300" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-slate-200/90">Memory</p>
                    <p className="text-[10px] text-slate-400">RAM consumption</p>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${ramStatus.color}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {ramStatus.label}
                </div>
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400">In use</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold tabular-nums text-slate-50">
                      {data.ramUsed}
                    </span>
                    <span className="text-xs text-slate-400">/ {data.ramTotal}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-semibold tabular-nums text-slate-50">
                    {data.ramUsage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400">utilized</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Progress
                  value={data.ramUsage}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Cached / free</span>
                  <span>Allocated</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip: quick summary */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-2.5 text-[11px] text-slate-300/80">
          <div className="flex flex-col gap-1 border-r border-slate-800/70 pr-2">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
              CPU Summary
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-200/90">Avg load</span>
              <span className="font-medium text-emerald-300 tabular-nums">
                {data.cpuUsage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 pl-2">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Memory Summary
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-200/90">Used</span>
              <span className="font-medium text-cyan-300 tabular-nums">
                {data.ramUsed} / {data.ramTotal}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Shell>
  );
};


// --- Widget Grid Component (includes redirectButton functionality) ---

const WidgetGrid = () => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusMap, setStatusMap] = useState<Record<string, boolean | undefined>>(
    {}
  );

  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        const res = await fetch("/api/buttons");
        if (!res.ok) throw new Error("Failed to fetch widgets");
        const json = (await res.json()) as DashboardWidget[];
        setWidgets(json);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load widgets");
      } finally {
        setLoading(false);
      }
    };

    fetchWidgets();
  }, []);

  useEffect(() => {
    const redirectWidgets = widgets.filter(
      (w) => w.type === "redirectButton" && w.statusApiEndpoint
    );

    if (!redirectWidgets.length) return;

    let cancelled = false;
    const POLL_INTERVAL_MS = 5000;

    const fetchStatus = async () => {
      await Promise.all(
        redirectWidgets.map(async (widget) => {
          try {
            const res = await fetch(widget.statusApiEndpoint!, {
              method: widget.statusApiMethod || "GET",
            });
            if (!res.ok) {
              throw new Error(
                `Status request failed for ${widget.id} with ${res.status}`
              );
            }
            const json = (await res.json()) as { online?: boolean };

            if (!cancelled) {
              setStatusMap((prev) => ({
                ...prev,
                [widget.id]: Boolean(json.online),
              }));
            }
          } catch (err) {
            console.error("Failed to fetch status for widget", widget.id, err);
            if (!cancelled) {
              // treat error as offline (or leave undefined if you prefer)
              setStatusMap((prev) => ({
                ...prev,
                [widget.id]: false,
              }));
            }
          }
        })
      );
    };

    // First run immediately
    fetchStatus();

    // Then poll
    const intervalId = window.setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [widgets]);

  const handleAction = (widget: DashboardWidget) => {
    if (!widget.endpoint) {
      toast.error("No endpoint configured for this action");
      return;
    }

    const promise = fetch(widget.endpoint, {
      method: "POST",
    }).then((res) => {
      if (!res.ok) throw new Error("Action failed");
      return res;
    });

    toast.promise(promise, {
      loading: `Running ${widget.label}...`,
      success: "Action completed",
      error: "Action failed",
    });
  };

  const handleToggle = (widget: DashboardWidget, checked: boolean) => {
    if (!widget.endpoint) {
      toast.error("No endpoint configured for this toggle");
      return;
    }

    const promise = fetch(widget.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: checked }),
    }).then((res) => {
      if (!res.ok) throw new Error("Toggle failed");
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === widget.id ? { ...w, toggleState: checked } : w
        )
      );
      return res;
    });

    toast.promise(promise, {
      loading: `Switching ${widget.label}...`,
      success: "State updated",
      error: "Failed to update state",
    });
  };

const handleRedirectAction = async (widget: DashboardWidget) => {
  // If neither redirectUrl nor apiEndpoint is provided, bail out
  if (!widget.redirectUrl && !widget.apiEndpoint) {
    console.error("redirectButton missing redirectUrl and apiEndpoint:", widget.id);
    toast.error("No redirect URL or API endpoint configured");
    return;
  }

  const doRedirect = () => {
    // same tab
    //window.location.href = widget.redirectUrl!;
    // or new tab:
    window.open(widget.redirectUrl!, "_blank", "noopener,noreferrer");
  };

  // If there is an API endpoint configured, call it first.
  if (widget.apiEndpoint) {
    const method: HttpMethod = widget.apiMethod || "POST";

    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      body: widget.apiData ? JSON.stringify(widget.apiData) : undefined,
    };

    const promise = fetch(widget.apiEndpoint, options)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        return res.json().catch(() => null);
      })
      .then(() => {
        // Only redirect if a redirectUrl was provided
        if (widget.redirectUrl) doRedirect();
      });

    toast.promise(promise, {
      loading: widget.redirectUrl ? `Preparing ${widget.buttonText || widget.label}...` : `Running ${widget.buttonText || widget.label}...`,
      success: widget.redirectUrl ? "Redirecting..." : "Action completed",
      error: widget.redirectUrl ? "Failed to process redirect" : "Action failed",
    });

    return;
  }

  // If we reached here, there was no apiEndpoint but there is a redirectUrl -> just redirect
  doRedirect();
};

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-16 w-full rounded-2xl bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (!widgets.length) {
    return (
      <div className="text-sm text-slate-300/70">
        No widgets configured.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {widgets.map((widget) => {
        // Type 1: Stat Display
        if (widget.type === "stat") {
          return (
            <div
              key={widget.id}
              className={cn(
                "h-20 flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40 transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/20",
                widget.variant === "outline" && "border-dashed"
              )}
            >
              <div className="flex items-center text-sm font-medium text-slate-50/90">
                {getIcon(widget.icon)}
                {widget.label}
              </div>
              <Badge
                variant="secondary"
                className="text-lg px-3 py-1 bg-slate-900/60 border border-white/15 text-slate-50/90 shadow-[0_0_18px_rgba(255,255,255,0.25)]"
              >
                {widget.value}
              </Badge>
            </div>
          );
        }

        // Type 2: Toggle Switch
        if (widget.type === "toggle") {
          return (
            <div
              key={widget.id}
              className="h-20 flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40 transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="flex items-center text-sm font-medium text-slate-50/90">
                {getIcon(widget.icon)}
                {widget.label}
              </div>
              <Switch
                checked={!!widget.toggleState}
                onCheckedChange={(c) => handleToggle(widget, c)}
              />
            </div>
          );
        }

        // Type 3: Redirect Button
        if (widget.type === "redirectButton") {
          const online = statusMap[widget.id]; // true | false | undefined

          return (
            <Button
              key={widget.id}
              variant={(widget.variant as any) || "secondary"}
              onClick={() => handleRedirectAction(widget)}
              className="h-20 w-full justify-start text-lg px-6 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 text-slate-50/90 backdrop-blur-xl shadow-lg shadow-black/40 transition-transform duration-200 hover:-translate-y-0.5"
            >
              {getIcon(widget.icon)}
              {widget.buttonText || widget.label}

              <div className="ml-auto flex items-center gap-2">
                {/* Status indicator */}
                {online !== undefined && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase",
                      online ? "text-emerald-300" : "text-rose-300"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        online ? "bg-emerald-400" : "bg-rose-400"
                      )}
                    />
                    {online ? "Online" : "Offline"}
                  </span>
                )}

                {widget.redirectUrl && (
                  <span className="opacity-60 text-[10px] tracking-[0.25em] uppercase">
                    Open
                  </span>
                )}
              </div>
            </Button>
          );
        }

        // Type 4: Standard Action Button
        return (
          <Button
            key={widget.id}
            variant={(widget.variant as any) || "ghost"}
            onClick={() => handleAction(widget)}
            className="h-20 w-full justify-start text-lg px-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-50/90 backdrop-blur-xl shadow-lg shadow-black/40 transition-transform duration-200 hover:-translate-y-0.5"
          >
            {getIcon(widget.icon)}
            {widget.label}
            <span className="ml-auto opacity-60 text-[10px] tracking-[0.25em] uppercase">
              Run
            </span>
          </Button>
        );
      })}
    </div>
  );
};

// --- Mainframe Page Component ---

export default function Mainframe() {
  const [theme, setTheme] = useState<GlassTheme>(() => {
    try {
      if (typeof window === "undefined") return "indigo";
      const saved = localStorage.getItem("mainframe-theme");
      return (saved as GlassTheme) || "indigo";
    } catch {
      return "indigo";
    }
  });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const currentTheme = glassThemes[theme];

  const strength = 8; // parallax strength
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { innerWidth, innerHeight } = window;
    const x = ((e.clientX - innerWidth / 2) / innerWidth) * strength;
    const y = ((e.clientY - innerHeight / 2) / innerHeight) * strength;
    setParallax({ x, y });
  };
  
  const cycleTheme = () => {
    const order: GlassTheme[] = [
      "indigo",
      "emerald",
      "rose",
      "cyan",
      "amber",
      "violet",
    ];
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
    try {
      if (typeof window !== "undefined") localStorage.setItem("mainframe-theme", next);
    } catch {
      /* ignore localStorage errors */
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("mainframe-theme", theme);
    } catch {
      /* ignore localStorage errors */
    }
  }, [theme]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "min-h-screen bg-gradient-to-br text-slate-50 relative overflow-hidden",
        currentTheme.bg
      )}
    >
      <Toaster />

      {/* Soft noise / light overlay (near layer) */}
      <div
        className="pointer-events-none fixed opacity-60 mix-blend-soft-light bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),transparent_55%)] will-change-transform"
        // make it a bit larger than viewport and keep it centered using negative offsets
        style={{
          left: "-8vw",
          top: "-8vh",
          right: "-8vw",
          bottom: "-8vh",
          transform: `translate3d(${parallax.x * 8}px, ${parallax.y * 8}px, 0) scale(1.08)`,
        }}
      />

      {/* Subtle grid (farther layer, moves more) */}
      <div
        className="pointer-events-none fixed opacity-[0.06] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:120px_120px] will-change-transform"
        style={{
          left: "-12vw",
          top: "-12vh",
          right: "-12vw",
          bottom: "-12vh",
          // bigger multiplier for the farther layer, but clamped by handleMouseMove above
          transform: `translate3d(${parallax.x * 18}px, ${parallax.y * 18}px, 0) scale(1.12)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur-xl text-[11px] uppercase tracking-[0.25em] text-slate-200/70 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
              Live Mainframe
            </div>
            <h1
              className={cn(
                "text-3xl md:text-4xl font-semibold tracking-tight drop-shadow-sm",
                currentTheme.accent
              )}
            >
              Mainframe
            </h1>
            <p className="text-slate-200/80 mt-1">
              System resource monitoring and controls in a glass cockpit.
            </p>
          </div>

          {/* Glass Theme Switcher */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="hidden md:inline text-xs text-slate-200/70 tracking-[0.25em] uppercase">
              Glass Theme
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cycleTheme}
              className={cn(
                "relative overflow-hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-slate-50/90 backdrop-blur-xl transition-colors",
                currentTheme.buttonRing
              )}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-70" />
              <span className="relative flex items-center gap-2">
                <span className="h-2 w-8 rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-[0_0_16px_rgba(255,255,255,0.9)]" />
                {currentTheme.label}
              </span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <SystemMonitor theme={theme} />
          <WidgetGrid />
        </div>
      </div>
    </div>
  );
}
