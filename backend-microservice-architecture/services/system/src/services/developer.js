import { notFoundError } from "@lifebookz/shared-errors";

/**
 * Developer operations.
 *
 * The monolith's developer module read application logs from MongoDB. Here
 * operational logs live in CloudWatch Logs (the shared logger writes JSON
 * lines), so `listLogs`/`stats` query CloudWatch Logs Insights instead of a
 * collection; System's own `AuditLog` covers privileged-action history and is
 * served from System's cluster.
 *
 * Housekeeping note: the monolith's `DELETE /developer/logs` (clear all /
 * clear older-than) is deliberately NOT carried over — privileged audit
 * trails are append-only; retention belongs to CloudWatch's
 * `logRetentionInDays` and lifecycle rules, configured in infrastructure.
 */
export function createDeveloperService({ auditLogs, cloudWatch, adminIdentity, logger }) {
  return {
    async me() {
      return adminIdentity();
    },

    /** Privileged-action audit trail (System's own cluster). */
    async logs(query) {
      return auditLogs.list(query);
    },

    async logStats() {
      return auditLogs.stats();
    },

    /**
     * Operational (application) logs from CloudWatch Logs Insights, for the
     * developer portal's system-health view. Falls back to an empty page when
     * the log group is not configured (local dev).
     */
    async applicationLogs(query = {}) {
      if (!cloudWatch) {
        return { logs: [], total: 0, page: 1, limit: 50, pages: 1, note: "CloudWatch log group not configured." };
      }

      return cloudWatch.queryLogs(query);
    },
  };
}

/**
 * CloudWatch Logs Insights client.
 *
 * Injected so tests stub it. Production wires the real client with the
 * platform's shared log group name.
 */
export function createCloudWatchLogs({ logGroupName, region, client } = {}) {
  if (!logGroupName) return null;

  async function queryLogs({ limit = 50, level, search } = {}) {
    // Lazily imported so unit tests never load the AWS SDK path.
    const { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand } = await import("@aws-sdk/client-cloudwatch-logs");

    const cw = client || new CloudWatchLogsClient({ region: region || process.env.AWS_REGION });

    const filterParts = [];
    if (level) filterParts.push(`level = "${level}"`);
    if (search?.trim()) filterParts.push(`message like /${search.trim().replace(/[/\\]/g, "")}/`);

    const started = await cw.send(
      new StartQueryCommand({
        logGroupName,
        startTime: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
        endTime: Math.floor(Date.now() / 1000),
        queryString: `fields @timestamp, level, service, message, operation, status, requestId | ${
          filterParts.length ? `filter ${filterParts.join(" and ")}` : ""
        } | sort @timestamp desc | limit ${Math.min(Number(limit) || 50, 200)}`,
      }),
    );

    // Insights queries are async; poll briefly (bounded — this is a
    // human-facing console, not a hot path).
    const queryId = started.queryId;
    let results = [];

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await cw.send(new GetQueryResultsCommand({ queryId }));

      if (response.status === "Complete") {
        results = response.results.map((row) =>
          Object.fromEntries(row.map((field) => [field.field, field.value])),
        );
        break;
      }

      if (response.status === "Failed" || response.status === "Cancelled" || response.status === "Timeout") {
        throw new Error(`CloudWatch Insights query ${response.status.toLowerCase()}.`);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return { logs: results, total: results.length, page: 1, limit, pages: 1 };
  }

  return { queryLogs };
}
