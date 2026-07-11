import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { MethodBadge } from '../../components/ui/Badge';
import { Callout } from '../../components/callouts/Callout';

export function AdminAPI() {
  return (
    <div>
      <h1>Admin API</h1>
      <p>
        Admin endpoints for platform management, moderation, analytics, and system administration.
        All admin endpoints require the <code>admin</code> or <code>moderator</code> role.
      </p>

      <Callout type="warning" title="Role Required">
        Admin endpoints return <code>403 Forbidden</code> if the authenticated user does not have
        the required role. Role checks are performed by the Lambda authorizer.
      </Callout>

      <h2>Moderation Endpoints</h2>

      <h3>List Pending Stories</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/moderation/pending</code>
      </div>
      <p>Returns stories pending moderation review, sorted by submission date (oldest first).</p>

      <h3>Approve Story</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/moderation/{storyId}/approve</code>
      </div>
      <p>Approves a story and triggers the embedding pipeline via SQS.</p>

      <CodeBlock language="json">
{`// Response (200 OK)
{
  "storyId": "story_01H2ABC...",
  "moderationStatus": "approved",
  "moderatedBy": "user_01H2DEF...",
  "moderatedAt": "2025-06-15T10:30:00Z",
  "embeddingQueued": true
}`}
      </CodeBlock>

      <h3>Reject Story</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/moderation/{storyId}/reject</code>
      </div>
      <p>Rejects a story with a reason. The author is notified.</p>

      <CodeBlock language="json">
{`// Request
{
  "reason": "Contains hate speech as defined in policy section 3.2",
  "note": "The story can be re-submitted after editing."
}

// Response (200 OK)
{
  "storyId": "story_01H2ABC...",
  "moderationStatus": "rejected",
  "moderatedBy": "user_01H2DEF...",
  "moderatedAt": "2025-06-15T10:30:00Z"
}`}
      </CodeBlock>

      <h2>Analytics Endpoints</h2>

      <h3>Platform Stats</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/analytics/overview</code>
      </div>
      <p>Returns key platform metrics: active users, stories published, moderation queue size, etc.</p>

      <h3>Moderation Analytics</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/analytics/moderation</code>
      </div>
      <p>Moderation metrics: approval rate, average review time, queue depth.</p>

      <h3>AI Cost Analytics</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/analytics/ai-costs</code>
      </div>
      <p>AI infrastructure costs broken down by model, feature, and time period.</p>

      <h2>System Endpoints</h2>

      <h3>Health Check</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/health</code>
      </div>
      <p>Health check for all downstream services.</p>

      <h3>Prompts Management</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/admin/prompts</code>
      </div>
      <p>List and manage AI prompt templates.</p>

      <h2>Endpoint Summary</h2>
      <Table
        headers={['Method', 'Path', 'Role', 'Description']}
        rows={[
          ['GET', '/v1/admin/moderation/pending', 'moderator', 'List pending stories'],
          ['POST', '/v1/admin/moderation/{id}/approve', 'moderator', 'Approve story'],
          ['POST', '/v1/admin/moderation/{id}/reject', 'moderator', 'Reject story'],
          ['GET', '/v1/admin/analytics/overview', 'admin', 'Platform overview'],
          ['GET', '/v1/admin/analytics/moderation', 'admin', 'Moderation metrics'],
          ['GET', '/v1/admin/analytics/ai-costs', 'admin', 'AI cost breakdown'],
          ['GET', '/v1/admin/health', 'admin', 'Service health check'],
          ['GET', '/v1/admin/prompts', 'admin', 'Prompt management'],
          ['PUT', '/v1/admin/prompts/{id}', 'admin', 'Update prompt template'],
        ]}
      />
    </div>
  );
}

export default AdminAPI;
