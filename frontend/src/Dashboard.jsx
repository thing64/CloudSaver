import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Cloud,
  Database,
  DollarSign,
  HardDrive,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  RefreshCcw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? "true") === "true";

const SERVICE_COLORS = {
  EC2: "#8b5cf6",
  EBS: "#22d3ee",
  RDS: "#f59e0b",
  "NAT Gateway": "#ec4899",
  "Elastic IP": "#34d399",
  "Load Balancer": "#60a5fa",
};

const navigation = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Resources", icon: Server },
  { label: "Savings", icon: CircleDollarSign },
  { label: "Policies", icon: ShieldCheck },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function apiUrl(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${API_BASE_URL}${path}${DEMO_MODE ? `${separator}demo=true` : ""}`;
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  accent,
  loading,
}) {
  const accents = {
    violet: {
      icon: "bg-violet-500/12 text-violet-300 ring-violet-400/20",
      glow: "from-violet-500/14",
    },
    cyan: {
      icon: "bg-cyan-500/12 text-cyan-300 ring-cyan-400/20",
      glow: "from-cyan-500/14",
    },
    emerald: {
      icon: "bg-emerald-500/12 text-emerald-300 ring-emerald-400/20",
      glow: "from-emerald-500/14",
    },
  };
  const theme = accents[accent];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.14]">
      <div
        className={cx(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-80",
          theme.glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          {loading ? (
            <div className="mt-3 h-9 w-32 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <p className="mt-2 truncate text-3xl font-semibold tracking-tight text-white">
              {value}
            </p>
          )}
        </div>
        <div
          className={cx(
            "grid size-11 shrink-0 place-items-center rounded-xl ring-1",
            theme.icon,
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>
      <div className="relative mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-400">
        <TrendingDown aria-hidden="true" className="size-3.5 text-emerald-400" />
        <span>{detail}</span>
      </div>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">
        {currency.format(payload[0].value)}
        <span className="ml-1 text-xs font-normal text-slate-500">/ month</span>
      </p>
    </div>
  );
}

function ServiceMark({ service }) {
  const icons = {
    EC2: Server,
    EBS: HardDrive,
    RDS: Database,
    "NAT Gateway": Activity,
    "Elastic IP": Cloud,
    "Load Balancer": Zap,
  };
  const Icon = icons[service] ?? Cloud;

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-slate-300 ring-1 ring-white/[0.08]">
      <Icon aria-hidden="true" className="size-4" />
    </span>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
    high: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
    medium: "bg-cyan-500/10 text-cyan-300 ring-cyan-400/20",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset",
        styles[severity] ?? styles.medium,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/[0.07] bg-slate-950/95 px-4 py-6 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="relative grid size-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/20">
              <Cloud aria-hidden="true" className="size-5" />
              <span className="absolute inset-x-1 bottom-1 h-px bg-white/40" />
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight text-white">
                CloudSaver
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                FinOps control
              </p>
            </div>
          </div>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="mt-10 space-y-1">
          {navigation.map((item) => (
            <button
              className={cx(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                item.active
                  ? "bg-violet-500/10 text-violet-200 ring-1 ring-inset ring-violet-400/15"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
              )}
              key={item.label}
              type="button"
            >
              <item.icon
                aria-hidden="true"
                className={cx(
                  "size-4.5",
                  item.active
                    ? "text-violet-300"
                    : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              {item.label}
              {item.active && (
                <span className="ml-auto size-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_2px_rgba(167,139,250,0.5)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Workspace
          </p>
          <button
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-100"
            type="button"
          >
            <Settings aria-hidden="true" className="size-4.5 text-slate-500" />
            Settings
          </button>
        </div>

        <div className="mt-auto rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-500/10 via-slate-900/40 to-cyan-500/5 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
            <Sparkles aria-hidden="true" className="size-4 text-violet-300" />
            Optimization engine
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Scans are evaluating utilization and ownership signals continuously.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-medium text-emerald-300">
              Monitoring active
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Dashboard() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All services");
  const [terminating, setTerminating] = useState(() => new Set());
  const [successMessage, setSuccessMessage] = useState("");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const loadResources = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/resources"), {
        headers: { accept: "application/json" },
        signal,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load cloud resources.");
      }

      setResources(Array.isArray(payload.items) ? payload.items : []);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message ?? "Unable to load cloud resources.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadResources(controller.signal);
    return () => controller.abort();
  }, [loadResources]);

  const activeResources = useMemo(
    () => resources.filter((resource) => resource.status !== "terminated"),
    [resources],
  );
  const terminatedResources = useMemo(
    () => resources.filter((resource) => resource.status === "terminated"),
    [resources],
  );
  const potentialMonthlyWaste = useMemo(
    () =>
      activeResources.reduce(
        (total, resource) => total + Number(resource.monthlyWaste ?? 0),
        0,
      ),
    [activeResources],
  );
  const totalSaved = useMemo(
    () =>
      terminatedResources.reduce(
        (total, resource) => total + Number(resource.monthlyWaste ?? 0),
        0,
      ),
    [terminatedResources],
  );
  const chartData = useMemo(() => {
    const grouped = activeResources.reduce((result, resource) => {
      result[resource.service] =
        (result[resource.service] ?? 0) + Number(resource.monthlyWaste ?? 0);
      return result;
    }, {});

    return Object.entries(grouped)
      .map(([service, waste]) => ({ service, waste }))
      .sort((left, right) => right.waste - left.waste);
  }, [activeResources]);
  const services = useMemo(
    () => [
      "All services",
      ...new Set(activeResources.map((resource) => resource.service)),
    ],
    [activeResources],
  );
  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeResources.filter((resource) => {
      const matchesService =
        serviceFilter === "All services" ||
        resource.service === serviceFilter;
      const matchesSearch =
        !query ||
        [
          resource.name,
          resource.resourceId,
          resource.service,
          resource.owner,
          resource.region,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesService && matchesSearch;
    });
  }, [activeResources, search, serviceFilter]);

  async function terminateResource(resource) {
    setTerminating((current) => new Set(current).add(resource.resourceId));
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(apiUrl("/resources/terminate"), {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ resourceId: resource.resourceId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message ?? "The resource could not be remediated.");
      }

      setResources((current) =>
        current.map((item) =>
          item.resourceId === resource.resourceId
            ? { ...item, ...payload.resource, status: "terminated" }
            : item,
        ),
      );
      setSuccessMessage(
        `${resource.name || resource.resourceId} was successfully terminated.`,
      );
    } catch (requestError) {
      setError(requestError.message ?? "The resource could not be remediated.");
    } finally {
      setTerminating((current) => {
        const next = new Set(current);
        next.delete(resource.resourceId);
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        onClose={() => setMobileNavigationOpen(false)}
        open={mobileNavigationOpen}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-slate-950/75 backdrop-blur-xl">
          <div className="flex h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Open navigation"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
                onClick={() => setMobileNavigationOpen(true)}
                type="button"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  Cloud efficiency overview
                </p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Last evaluated moments ago
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={cx(
                  "hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset sm:flex",
                  error
                    ? "bg-rose-500/10 text-rose-300 ring-rose-400/20"
                    : "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
                )}
              >
                <span
                  className={cx(
                    "size-1.5 rounded-full",
                    error ? "bg-rose-400" : "bg-emerald-400",
                  )}
                />
                {error ? "Action required" : loading ? "Syncing" : "API connected"}
              </div>
              <button
                aria-label="Notifications"
                className="relative grid size-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:border-white/15 hover:text-white"
                type="button"
              >
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-violet-400 ring-2 ring-slate-950" />
              </button>
              <button
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-2 text-sm text-slate-300 transition hover:border-white/15"
                type="button"
              >
                <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 text-[10px] font-bold text-slate-950">
                  CS
                </span>
                <ChevronDown className="hidden size-3.5 text-slate-500 sm:block" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative isolate overflow-hidden px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="pointer-events-none absolute -right-32 -top-40 -z-10 size-96 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="pointer-events-none absolute left-1/4 top-96 -z-10 size-80 rounded-full bg-cyan-500/[0.06] blur-3xl" />

          <section className="mx-auto max-w-[1500px]">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-violet-300">
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  Intelligent cloud optimization
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Cost optimization dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Prioritize idle infrastructure, understand spend exposure, and
                  take auditable remediation actions from one control plane.
                </p>
              </div>
              <button
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 shadow-lg transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                onClick={() => loadResources()}
                type="button"
              >
                <RefreshCcw
                  aria-hidden="true"
                  className={cx("size-4", loading && "animate-spin")}
                />
                Refresh scan
              </button>
            </div>

            {(error || successMessage) && (
              <div
                className={cx(
                  "mt-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm",
                  error
                    ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
                )}
                role={error ? "alert" : "status"}
              >
                <div className="flex items-center gap-2.5">
                  {error ? (
                    <AlertTriangle className="size-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0" />
                  )}
                  <span>{error || successMessage}</span>
                </div>
                <button
                  aria-label="Dismiss message"
                  className="rounded-md p-0.5 opacity-70 hover:opacity-100"
                  onClick={() => {
                    setError("");
                    setSuccessMessage("");
                  }}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <MetricCard
                accent="violet"
                detail="Identified across active findings"
                icon={DollarSign}
                loading={loading}
                title="Potential Monthly Waste ($)"
                value={currency.format(potentialMonthlyWaste)}
              />
              <MetricCard
                accent="cyan"
                detail="Ready for engineering review"
                icon={Activity}
                loading={loading}
                title="Active Idle Resources"
                value={activeResources.length.toLocaleString()}
              />
              <MetricCard
                accent="emerald"
                detail="Monthly run rate eliminated"
                icon={CircleDollarSign}
                loading={loading}
                title="Total Money Saved ($)"
                value={currency.format(totalSaved)}
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
              <section className="rounded-2xl border border-white/[0.08] bg-slate-900/65 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3
                        aria-hidden="true"
                        className="size-4 text-violet-300"
                      />
                      <h2 className="text-sm font-semibold text-white">
                        Waste by cloud service
                      </h2>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Current monthly exposure from active idle resources
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-inset ring-white/[0.07]">
                    Monthly estimate
                  </span>
                </div>

                <div className="mt-6 h-72 w-full">
                  {loading ? (
                    <div className="flex h-full items-end gap-4 px-8 pb-8">
                      {[58, 82, 45, 68, 38].map((height) => (
                        <div
                          className="flex-1 animate-pulse rounded-t-lg bg-white/[0.06]"
                          key={height}
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="grid h-full place-items-center">
                      <div className="text-center">
                        <Check className="mx-auto size-7 text-emerald-400" />
                        <p className="mt-2 text-sm font-medium text-slate-300">
                          No active waste detected
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer height="100%" width="100%">
                      <BarChart
                        data={chartData}
                        margin={{ bottom: 0, left: -15, right: 6, top: 10 }}
                      >
                        <CartesianGrid
                          stroke="rgba(148, 163, 184, 0.08)"
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          axisLine={false}
                          dataKey="service"
                          interval={0}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          tickLine={false}
                        />
                        <YAxis
                          axisLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          tickFormatter={(value) => `$${value}`}
                          tickLine={false}
                          width={58}
                        />
                        <Tooltip
                          content={<ChartTooltip />}
                          cursor={{ fill: "rgba(148, 163, 184, 0.04)" }}
                        />
                        <Bar
                          dataKey="waste"
                          maxBarSize={54}
                          radius={[7, 7, 2, 2]}
                        >
                          {chartData.map((entry) => (
                            <Cell
                              fill={SERVICE_COLORS[entry.service] ?? "#8b5cf6"}
                              key={entry.service}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              <aside className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.12] via-slate-900/70 to-cyan-500/[0.08] p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
                <div className="absolute -right-10 -top-10 size-32 rounded-full bg-violet-400/10 blur-2xl" />
                <div className="relative">
                  <span className="grid size-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
                    <Zap className="size-5" />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                    Highest impact
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                    {chartData[0]?.service ?? "Environment optimized"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {chartData[0]
                      ? `${currency.format(chartData[0].waste)} of avoidable monthly spend is concentrated in this service.`
                      : "No active optimization findings require action."}
                  </p>
                  <div className="mt-6 border-t border-white/[0.08] pt-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Coverage</span>
                      <span className="font-medium text-slate-300">
                        {activeResources.length} findings
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
                        style={{
                          width: chartData[0]
                            ? `${Math.max(
                                12,
                                (chartData[0].waste /
                                  Math.max(potentialMonthlyWaste, 1)) *
                                  100,
                              )}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/65 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-6 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Idle resource findings
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Review utilization evidence before taking a remediation action
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <label className="relative block">
                    <span className="sr-only">Search resources</span>
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      className="h-10 w-full rounded-xl border border-white/[0.08] bg-slate-950/50 pl-9 pr-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/10 sm:w-64"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search resources…"
                      type="search"
                      value={search}
                    />
                  </label>
                  <label className="relative block">
                    <span className="sr-only">Filter by service</span>
                    <select
                      className="h-10 w-full appearance-none rounded-xl border border-white/[0.08] bg-slate-950/50 pl-3 pr-9 text-sm text-slate-300 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/10 sm:w-40"
                      onChange={(event) => setServiceFilter(event.target.value)}
                      value={serviceFilter}
                    >
                      {services.map((service) => (
                        <option key={service}>{service}</option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                    />
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      <th className="px-6 py-3.5">Resource</th>
                      <th className="px-4 py-3.5">Finding</th>
                      <th className="px-4 py-3.5">Owner</th>
                      <th className="px-4 py-3.5">Risk</th>
                      <th className="px-4 py-3.5 text-right">Monthly waste</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.055]">
                    {loading
                      ? Array.from({ length: 4 }, (_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4" colSpan={6}>
                              <div className="h-11 animate-pulse rounded-lg bg-white/[0.035]" />
                            </td>
                          </tr>
                        ))
                      : filteredResources.map((resource) => {
                          const isTerminating = terminating.has(
                            resource.resourceId,
                          );
                          return (
                            <tr
                              className="group transition hover:bg-white/[0.025]"
                              key={resource.resourceId}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <ServiceMark service={resource.service} />
                                  <div className="min-w-0">
                                    <p className="max-w-52 truncate text-sm font-medium text-slate-200">
                                      {resource.name || resource.resourceId}
                                    </p>
                                    <p className="mt-1 max-w-52 truncate font-mono text-[10px] text-slate-600">
                                      {resource.resourceId} · {resource.region}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="max-w-xs text-xs leading-5 text-slate-400">
                                  {resource.finding}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-400">
                                {resource.owner}
                              </td>
                              <td className="px-4 py-4">
                                <SeverityBadge severity={resource.severity} />
                              </td>
                              <td className="px-4 py-4 text-right">
                                <p className="text-sm font-semibold text-white">
                                  {currency.format(resource.monthlyWaste)}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-600">
                                  {currency.format(resource.dailyWaste)}/day
                                </p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  className="inline-flex min-w-27 items-center justify-center gap-2 rounded-lg bg-rose-500/12 px-3 py-2 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/20 transition hover:bg-rose-500/20 hover:text-rose-200 disabled:cursor-wait disabled:opacity-60"
                                  disabled={isTerminating}
                                  onClick={() => terminateResource(resource)}
                                  type="button"
                                >
                                  {isTerminating ? (
                                    <LoaderCircle
                                      aria-hidden="true"
                                      className="size-3.5 animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      aria-hidden="true"
                                      className="size-3.5"
                                    />
                                  )}
                                  {isTerminating ? "Working…" : "Terminate"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {!loading && filteredResources.length === 0 && (
                <div className="border-t border-white/[0.06] px-6 py-14 text-center">
                  <CheckCircle2 className="mx-auto size-8 text-emerald-400" />
                  <p className="mt-3 text-sm font-medium text-slate-300">
                    No matching idle resources
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Adjust your filters or refresh the latest scan.
                  </p>
                </div>
              )}

              <footer className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3.5 text-xs text-slate-500 sm:px-6">
                <span>
                  Showing {filteredResources.length} of {activeResources.length}{" "}
                  active findings
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Actions are recorded for audit
                </span>
              </footer>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
