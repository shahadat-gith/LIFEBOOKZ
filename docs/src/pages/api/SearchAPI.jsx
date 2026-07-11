import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { MethodBadge } from '../../components/ui/Badge';
import { Callout } from '../../components/callouts/Callout';

export function SearchAPI() {
  return (
    <div>
      <h1>Search API</h1>
      <p>
        The Search API provides <strong>semantic search</strong> powered by Qdrant vector embeddings,
        recommendations, and content discovery endpoints.
      </p>

      <h2>Endpoints</h2>

      <h3>Semantic Search</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/search</code>
      </div>
      <p>Search stories by semantic meaning. The query is embedded and compared against story embeddings in Qdrant.</p>

      <CodeBlock language="bash">
{`# Basic search
GET /v1/search?q=overcoming+fear+of+failure

# With filters
GET /v1/search?q=career+change&language=en&category=life-story

# With pagination
GET /v1/search?q=travel+stories&limit=10&cursor=eyJpZCI6IjEyMyJ9

# Minimum relevance threshold
GET /v1/search?q=adventure&minScore=0.5`}
      </CodeBlock>

      <CodeBlock language="json">
{`// Response (200 OK)
{
  "results": [
    {
      "id": "story_01H2ABC...",
      "title": "Quitting My Job to Travel the World",
      "excerpt": "I remember the exact moment I decided to leave everything behind...",
      "author": {
        "id": "user_01H2DEF...",
        "username": "wandering soul",
        "avatar": "https://..."
      },
      "score": 0.89,
      "category": "life-story",
      "language": "en",
      "tags": ["travel", "career-change", "adventure"],
      "publishedAt": "2025-05-20T14:30:00Z",
      "media": []
    }
  ],
  "total": 47,
  "query": "quitting job to travel",
  "cursor": "eyJpZCI6IjEyMyJ9"
}`}
      </CodeBlock>

      <h3>Get Recommendations</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/recommendations/feed</code>
      </div>
      <p>Get personalized story recommendations based on the user's embedding.</p>

      <CodeBlock language="bash">
{`# Get personalized feed
GET /v1/recommendations/feed?limit=20

# Get recommendations for a specific story
GET /v1/recommendations/similar/{storyId}?limit=10`}
      </CodeBlock>

      <h3>Get Community Suggestions</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/recommendations/communities</code>
      </div>
      <p>Get community suggestions based on user preferences and interests.</p>

      <h3>Get Mentor Matches</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/recommendations/mentors</code>
      </div>
      <p>Find potential mentors based on professional similarity.</p>

      <h3>Trending Stories</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="GET" />
        <code className="text-sm font-mono text-slate-700">/v1/search/trending</code>
      </div>
      <p>Get currently trending stories based on recent engagement velocity.</p>

      <h2>Endpoint Summary</h2>
      <Table
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['GET', '/v1/search', 'Optional', 'Semantic search'],
          ['GET', '/v1/recommendations/feed', 'Required', 'Personalized feed'],
          ['GET', '/v1/recommendations/similar/{id}', 'Optional', 'Similar stories'],
          ['GET', '/v1/recommendations/communities', 'Required', 'Community suggestions'],
          ['GET', '/v1/recommendations/mentors', 'Required', 'Mentor matches'],
          ['GET', '/v1/search/trending', 'Optional', 'Trending stories'],
        ]}
      />

      <Callout type="info" title="Search Performance">
        Semantic search queries average ~35ms P95 latency. Results are ranked by cosine similarity
        score (0.0 to 1.0). The default <code>minScore</code> threshold is 0.2 to filter out
        irrelevant results.
      </Callout>
    </div>
  );
}

export default SearchAPI;
