import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { MethodBadge } from '../../components/ui/Badge';

export function UserAPI() {
  return (
    <div>
      <h1>User API</h1>
      <p>
        User management endpoints for profile operations, preferences, and account settings.
      </p>

      <h2>Endpoints</h2>

      <h3>Get Current User</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/users/me</code>
      </div>
      <p>Returns the authenticated user's profile.</p>

      <CodeBlock language="json">
{`// Response (200 OK)
{
  "id": "user_01H2ABC...",
  "username": "johndoe",
  "displayName": "John Doe",
  "bio": "Software engineer and aspiring writer.",
  "avatar": "https://res.cloudinary.com/...",
  "preferences": {
    "interests": ["storytelling", "technology"],
    "profession": "software-engineer",
    "languages": ["en", "es"]
  },
  "stats": {
    "storyCount": 12,
    "totalViews": 5432,
    "memberSince": "2025-01-15T10:30:00Z"
  }
}`}
      </CodeBlock>

      <h3>Update Profile</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="PATCH" />
        <code className="text-sm font-mono text-slate-700">/v1/users/me</code>
      </div>
      <p>Update display name, bio, avatar, and preferences.</p>

      <CodeBlock language="json">
{`// Request
{
  "displayName": "John Updated",
  "bio": "Now a full-time writer.",
  "preferences": {
    "interests": ["writing", "philosophy", "history"]
  }
}

// Response (200 OK)
{
  "id": "user_01H2ABC...",
  "displayName": "John Updated",
  "bio": "Now a full-time writer.",
  "preferences": {
    "interests": ["writing", "philosophy", "history"],
    "profession": "software-engineer",
    "languages": ["en", "es"]
  }
}`}
      </CodeBlock>

      <h3>Get User by ID</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/users/{userId}</code>
      </div>
      <p>Returns a public user profile.</p>

      <h3>Get User Stories</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/users/{userId}/stories</code>
      </div>
      <p>Returns paginated list of a user's published stories.</p>

      <h3>Update Preferences</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="PUT" />
        <code className="text-sm font-mono text-slate-700">/v1/users/me/preferences</code>
      </div>
      <p>Updates user preferences and triggers embedding regeneration.</p>

      <h3>Delete Account</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="DELETE" />
        <code className="text-sm font-mono text-slate-700">/v1/users/me</code>
      </div>
      <p>Permanently deletes the user account and all associated data.</p>

      <h2>Endpoint Summary</h2>
      <Table
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['GET', '/v1/users/me', 'Required', 'Get current user profile'],
          ['PATCH', '/v1/users/me', 'Required', 'Update profile'],
          ['DELETE', '/v1/users/me', 'Required', 'Delete account'],
          ['GET', '/v1/users/{userId}', 'Optional', 'Get public user profile'],
          ['GET', '/v1/users/{userId}/stories', 'Optional', "Get user's stories"],
          ['PUT', '/v1/users/me/preferences', 'Required', 'Update preferences'],
          ['GET', '/v1/users/me/stats', 'Required', 'Get personal stats'],
        ]}
      />
    </div>
  );
}

export default UserAPI;
