import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { LOG_LEVELS, config } from "../config";
import { clearLogs, getLogs, getLogStats } from "../utils/client";
import { Icons } from "../icons";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";

const LEVEL_BADGE = {
  error: "danger",
  warn: "warning",
  info: "info",
  debug: "default",
};

const DEFAULT_FILTERS = {
  level: "",
  search: "",
  from: "",
  to: "",
  limit: "50",
};

function timeAgo(value) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";

  const seconds = Math.max(Math.round((Date.now() - then) / 1000), 0);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Logs() {
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [applied, setApplied] = useState({ ...DEFAULT_FILTERS, limit: 50 });
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ logs: [], total: 0, pages: 1 });
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const buildParams = useCallback((targetPage, source) => {
    const params = { page: targetPage, limit: source.limit };

    if (source.level) params.level = source.level;
    if (source.search.trim()) params.search = source.search.trim();
    if (source.from) params.from = new Date(source.from).toISOString();
    if (source.to) params.to = new Date(source.to).toISOString();

    return params;
  }, []);

  const loadLogs = useCallback(
    async (targetPage, source, { silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const result = await getLogs(buildParams(targetPage, source));
        setData({
          logs: result.logs || [],
          total: result.total || 0,
          pages: result.pages || 1,
        });
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Could not load logs from the API.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildParams],
  );

  const loadStats = useCallback(async () => {
    try {
      setStats(await getLogStats());
    } catch {
      // Stats are supplementary — never block the log list on them.
    }
  }, []);

  // Load whenever the filters or page change.
  useEffect(() => {
    loadLogs(page, applied);
  }, [page, applied, loadLogs]);

  // Stats once on mount.
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Optional polling so a developer can watch failures come in live.
  useEffect(() => {
    if (!autoRefresh) return undefined;

    const id = setInterval(() => {
      loadLogs(page, applied, { silent: true });
      loadStats();
    }, config.logRefreshMs);

    return () => clearInterval(id);
  }, [autoRefresh, page, applied, loadLogs, loadStats]);

  const handleApply = (e) => {
    e.preventDefault();
    setApplied({ ...draft, limit: Number(draft.limit) || 50 });
    setPage(1);
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    setApplied({ ...DEFAULT_FILTERS, limit: 50 });
    setPage(1);
  };

  const handleClear = async (olderThanDays) => {
    setClearing(true);
    try {
      const res = await clearLogs(olderThanDays);
      toast.success(res.message || "Logs cleared");
      setConfirmClear(false);
      setPage(1);
      await Promise.all([loadLogs(1, applied), loadStats()]);
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || "Could not clear logs.",
      );
    } finally {
      setClearing(false);
    }
  };

  const byLevel = stats?.byLevel || {};
  const hasFilters = Boolean(
    applied.level || applied.search.trim() || applied.from || applied.to,
  );

  const statCards = useMemo(
    () => [
      {
        label: "Errors (24h)",
        value: byLevel.error || 0,
        tone: "text-destructive",
        icon: Icons.exclamationCircle,
      },
      {
        label: "Warnings (24h)",
        value: byLevel.warn || 0,
        tone: "text-warning",
        icon: Icons.exclamation,
      },
      {
        label: "Logs (24h)",
        value: stats?.last24h || 0,
        tone: "text-info",
        icon: Icons.clock,
      },
      {
        label: "Total stored",
        value: stats?.total || 0,
        tone: "text-foreground",
        icon: Icons.chartBar,
      },
    ],
    [byLevel, stats],
  );

  const filterInputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Icons.terminal className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Application Logs</h1>
            <p className="text-sm text-muted-foreground">
              Failures, warnings and job errors captured by the API
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={autoRefresh ? "primary" : "outline"}
            onClick={() => setAutoRefresh((v) => !v)}
            icon={
              autoRefresh ? (
                <Icons.pause className="h-4 w-4" />
              ) : (
                <Icons.play className="h-4 w-4" />
              )
            }
          >
            {autoRefresh ? "Live" : "Live off"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={refreshing}
            onClick={() => {
              loadLogs(page, applied, { silent: true });
              loadStats();
            }}
            icon={<Icons.refresh className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant={confirmClear ? "danger" : "outline"}
            onClick={() => setConfirmClear((v) => !v)}
            disabled={clearing}
            icon={<Icons.trash className="h-3.5 w-3.5" />}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Clear confirmation */}
      {confirmClear && (
        <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-destructive">
            Delete log history? This cannot be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleClear(7)}
              disabled={clearing}
            >
              Older than 7 days
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleClear()}
              loading={clearing}
            >
              Delete everything
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmClear(false)}
              disabled={clearing}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} padding="md" className="border border-border">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <Icon className={`h-4 w-4 ${card.tone}`} />
              </div>
              <p className={`mt-2 font-display text-3xl font-semibold ${card.tone}`}>
                {card.value}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6 border border-border">
        <form onSubmit={handleApply} className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Level
            </label>
            <select
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value })}
              className={filterInputClass}
            >
              <option value="">All levels</option>
              {LOG_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Icons.search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                placeholder="Search logs by message, route or email"
                className={`${filterInputClass} pl-9`}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              From
            </label>
            <input
              type="datetime-local"
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              className={filterInputClass}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              To
            </label>
            <input
              type="datetime-local"
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              className={filterInputClass}
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Rows
            </label>
            <select
              value={draft.limit}
              onChange={(e) => setDraft({ ...draft, limit: e.target.value })}
              className={filterInputClass}
            >
              {["25", "50", "100", "200"].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 lg:col-span-12">
            <Button type="submit" size="sm" icon={<Icons.filter className="h-3.5 w-3.5" />}>
              Apply filters
            </Button>
            {hasFilters && (
              <Button type="button" size="sm" variant="ghost" onClick={handleReset}>
                Reset
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {refreshing ? "Refreshing…" : `${data.total} matching entries`}
            </span>
          </div>
        </form>
      </Card>

      {/* Log list */}
      <Card className="border border-border">
        {error ? (
          <div className="flex items-center gap-2 p-5 text-sm text-destructive">
            <Icons.exclamationCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={() => loadLogs(page, applied)}>
              Retry
            </Button>
          </div>
        ) : loading ? (
          <LoadingScreen message="Loading logs..." />
        ) : data.logs.length === 0 ? (
          <EmptyState
            icon={<Icons.checkCircle className="h-12 w-12" />}
            title="No log entries"
            description={
              hasFilters
                ? "No logs match the current filters."
                : "Nothing has failed yet — warnings and errors will appear here."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {data.logs.map((log) => {
              const id = log._id || `${log.timestamp}-${log.message}`;
              const expanded = expandedId === id;
              const meta = log.meta || {};
              const hasMeta = Object.keys(meta).length > 0;

              return (
                <li key={id} className="p-4 transition-colors hover:bg-muted/30 sm:p-5">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : id)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant={LEVEL_BADGE[log.level] || "default"}>
                        {String(log.level || "info").toUpperCase()}
                      </Badge>

                      <span
                        className="text-xs text-muted-foreground"
                        title={formatTimestamp(log.timestamp)}
                      >
                        <Icons.clock className="mr-1 inline h-3 w-3" />
                        {timeAgo(log.timestamp)}
                      </span>

                      {meta.statusCode && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            meta.statusCode >= 500
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {meta.statusCode}
                        </span>
                      )}

                      {hasMeta && (
                        <Icons.chevronDown
                          className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>

                    <p className="mt-2 font-mono text-[13px] leading-6 text-foreground break-words">
                      {log.message}
                    </p>

                    {(meta.method || meta.durationMs !== undefined || meta.role) && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {meta.method && (
                          <span className="font-mono">
                            {meta.method} {meta.path}
                          </span>
                        )}
                        {meta.durationMs !== undefined && (
                          <span>{meta.durationMs}ms</span>
                        )}
                        {meta.role && <span>role: {meta.role}</span>}
                        {meta.jobType && <span>job: {meta.jobType}</span>}
                      </div>
                    )}
                  </button>

                  {expanded && hasMeta && (
                    <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-5 text-muted-foreground">
                      {JSON.stringify(meta, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {!loading && !error && data.logs.length > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-border p-4">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              icon={<Icons.chevronLeft className="h-3.5 w-3.5" />}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {data.pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => Math.min(p + 1, data.pages))}
            >
              Next
              <Icons.chevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
