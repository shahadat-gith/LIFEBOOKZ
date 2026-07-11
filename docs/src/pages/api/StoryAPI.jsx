import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { MethodBadge } from '../../components/ui/Badge';
import { Callout } from '../../components/callouts/Callout';

export function StoryAPI() {
  return (
    <div>
      <h1>Story API</h1>
      <p>
        Complete CRUD operations for life stories, diaries, time capsules, and other content types.
        Stories flow through moderation before being published.
      </p>

      <h2>Endpoints</h2>

      <h3>Create Story</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/stories</code>
      </div>
      <p>Create a new story. The story is saved as a draft initially (moderationStatus: 'pending').</p>

      <CodeBlock language="json">
{`// Request
{
  "title": "My Journey Through Silicon Valley",
  "content": "It was a rainy Tuesday morning when I first stepped into...",
  "category": "life-story",
  "tags": ["career", "technology", "personal-growth"],
  "language": "en",
  "media": [
    {
      "type": "photo",
      "url": "https://res.cloudinary.com/...",
      "publicId": "stories/abc123",
      "caption": "My first day at the startup"
    }
  ]
}

// Response (201 Created)
{
  "id": "story_01H2ABC...",
  "authorId": "user_01H2ABC...",
  "title": "My Journey Through Silicon Valley",
  "moderationStatus": "pending",
  "createdAt": "2025-06-15T10:30:00Z"
}`}
      </CodeBlock>

      <h3>Get Story</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/stories/{storyId}</code>
      </div>
      <p>Returns a story by ID. Only returns published stories to non-authors.</p>

      <h3>Update Story</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="PATCH" />
        <code className="text-sm font-mono text-slate-700">/v1/stories/{storyId}</code>
      </div>
      <p>Update story content. Resets moderation status to 'pending' for re-review.</p>

      <h3>Delete Story</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="DELETE" />
        <code className="text-sm font-mono text-slate-700">/v1/stories/{storyId}</code>
      </div>
      <p>Soft-delete a story. Only the author can delete their own stories.</p>

      <h3>List Stories</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/stories</code>
      </div>
      <p>List published stories with filtering and cursor-based pagination.</p>

      <CodeBlock language="bash">
{`# List all published stories
GET /v1/stories?limit=20

# Filter by category
GET /v1/stories?category=life-story

# Filter by language
GET /v1/stories?language=en

# Filter by tags (comma-separated)
GET /v1/stories?tags=career,technology

# Combined filters
GET /v1/stories?category=life-story&language=en&tags=career&limit=10

# Pagination
GET /v1/stories?limit=20&cursor=eyJpZCI6IjEyMyJ9`}
      </CodeBlock>

      <h3>Like/Unlike Story</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/stories/{storyId}/like</code>
      </div>
      <p>Toggle like on a story. Returns the new like count.</p>

      <h3>Get Story Comments</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/stories/{storyId}/comments</code>
      </div>
      <p>Returns paginated comments for a story.</p>

      <h3>Add Comment</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/stories/{storyId}/comments</code>
      </div>
      <p>Add a comment to a story.</p>

      <h2>Endpoint Summary</h2>
      <Table
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['POST', '/v1/stories', 'Required', 'Create story'],
          ['GET', '/v1/stories', 'Optional', 'List stories'],
          ['GET', '/v1/stories/{id}', 'Optional', 'Get story by ID'],
          ['PATCH', '/v1/stories/{id}', 'Required (Owner)', 'Update story'],
          ['DELETE', '/v1/stories/{id}', 'Required (Owner)', 'Delete story'],
          ['POST', '/v1/stories/{id}/like', 'Required', 'Toggle like'],
          ['GET', '/v1/stories/{id}/comments', 'Optional', 'List comments'],
          ['POST', '/v1/stories/{id}/comments', 'Required', 'Add comment'],
        ]}
      />

      <Callout type="info" title="Moderation Flow">
        Newly created or updated stories have <code>moderationStatus: 'pending'</code>. They are
        not publicly visible until approved by the moderation service. Authors can see their own
        pending stories.
      </Callout>
    </div>
  );
}

export default StoryAPI;
