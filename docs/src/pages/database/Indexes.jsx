import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { Callout } from '../../components/callouts/Callout';
import { Mermaid } from '../../components/mermaid/Mermaid';

export function Indexes() {
  return (
    <div>
      <h1>Indexes & Performance</h1>
      <p>
        Proper indexing is critical for maintaining fast query performance at scale. This page documents
        our index strategy, query patterns, and performance tuning approach for MongoDB and Qdrant.
      </p>

      <h2>MongoDB Index Strategy</h2>

      <Mermaid
        chart={`graph TB
    subgraph Users["Users Collection Indexes"]
        U1[email (Unique)]
        U2[username (Unique)]
        U3[role_status (Compound)]
    end

    subgraph Stories["Stories Collection Indexes"]
        S1[authorId + publishedAt]
        S2[moderationStatus + publishedAt]
        S3[category + language]
        S4[tags (Multikey)]
        S5[title_text + content_text]
        S6[publishedAt (TTL)]
    end

    subgraph Comments["Comments Collection Indexes"]
        C1[storyId + createdAt]
        C2[authorId + createdAt]
    end

    subgraph Queries["Common Queries"]
        Q1[Login: find by email]
        Q2[Feed: find by author sorted by date]
        Q3[Moderation: find pending sorted by date]
        Q4[Browse: filter by category + language]
        Q5[Search: text search on title/content]
    end

    Q1 --> U1
    Q2 --> S1
    Q3 --> S2
    Q4 --> S3
    Q5 --> S5`}
        caption="MongoDB index strategy mapped to query patterns"
      />

      <h2>Complete Index List</h2>
      <Table
        headers={['Collection', 'Index Definition', 'Type', 'Keys', 'Usage']}
        rows={[
          ['users', '{ email: 1 }', 'Unique', '1', 'Login, email verification'],
          ['users', '{ username: 1 }', 'Unique', '1', 'Profile lookup'],
          ['users', '{ role: 1, isActive: 1 }', 'Compound', '2', 'Admin user management'],
          ['stories', '{ authorId: 1, publishedAt: -1 }', 'Compound', '3', 'Author feed, profile stories'],
          ['stories', '{ moderationStatus: 1, publishedAt: -1 }', 'Compound', '3', 'Moderation queue'],
          ['stories', '{ category: 1, language: 1, publishedAt: -1 }', 'Compound', '5', 'Browse by category'],
          ['stories', '{ tags: 1 }', 'Multikey', '1', 'Tag-based discovery'],
          ['stories', '{ title: "text", content: "text" }', 'Text', '2', 'Full-text search fallback'],
          ['stories', '{ publishedAt: 1 }', 'TTL', '1', 'TTL index for drafts'],
          ['comments', '{ storyId: 1, createdAt: -1 }', 'Compound', '3', 'Story comments feed'],
          ['comments', '{ authorId: 1, createdAt: -1 }', 'Compound', '3', 'User comment history'],
          ['comments', '{ parentId: 1 }', 'Single', '1', 'Nested replies lookup'],
        ]}
      />

      <h2>Query Performance</h2>

      <CodeBlock language="javascript">
{`// Check index usage with explain()
db.stories.find({
  authorId: ObjectId("..."),
  publishedAt: { $gte: ISODate("2025-01-01") }
})
.sort({ publishedAt: -1 })
.limit(20)
.explain("executionStats")

// Expected output:
// - IXSCAN (index scan) on authorId_1_publishedAt_-1
// - nReturned: 20
// - totalDocsExamined: 20
// - executionTimeMillis: ~2ms`}
      </CodeBlock>

      <h2>Index Performance Metrics</h2>
      <Table
        headers={['Query Pattern', 'Without Index', 'With Index', 'Improvement']}
        rows={[
          ['Author feed', '450ms (COLLSCAN)', '3ms (IXSCAN)', '150x'],
          ['Moderation queue', '320ms (COLLSCAN)', '5ms (IXSCAN)', '64x'],
          ['Category browse', '280ms (COLLSCAN)', '8ms (IXSCAN)', '35x'],
          ['Text search', '600ms (regex)', '15ms (TEXT)', '40x'],
          ['Comments by story', '180ms (COLLSCAN)', '2ms (IXSCAN)', '90x'],
        ]}
      />

      <h2>Index Maintenance</h2>
      <h3>Building Indexes</h3>
      <p>
        Indexes are built in the background to avoid blocking writes:
      </p>
      <CodeBlock language="javascript">
{`// Background index creation
db.stories.createIndex(
  { category: 1, language: 1, publishedAt: -1 },
  {
    name: "category_language_publishedAt",
    background: true,
    collation: { locale: "en", strength: 2 }
  }
);`}
      </CodeBlock>

      <h3>Index Monitoring</h3>
      <ul>
        <li><strong>Slow queries:</strong> Monitored via MongoDB Atlas Performance Advisor</li>
        <li><strong>Index size:</strong> Tracked to ensure indexes fit in working memory</li>
        <li><strong>Unused indexes:</strong> Identified via <code>$indexStats</code> aggregation</li>
        <li><strong>Index fragmentation:</strong> Measured and compacted when necessary</li>
      </ul>

      <CodeBlock language="javascript">
{`// Find unused indexes
db.stories.aggregate([
  { $indexStats: {} },
  { $match: { accesses: { ops: 0 } } }
])

// Check index sizes
db.stories.aggregate([
  { $collStats: { storageStats: {} } }
])`}
      </CodeBlock>

      <h2>Qdrant Index Configuration</h2>
      <p>
        Qdrant uses HNSW (Hierarchical Navigable Small World) indexes for fast approximate
        nearest neighbor search. Key parameters:
      </p>
      <Table
        headers={['Parameter', 'Value', 'Effect']}
        rows={[
          ['m', '16', 'Higher = better recall, more memory'],
          ['ef_construct', '128', 'Higher = better index quality, slower build'],
          ['ef_search', '128', 'Higher = better recall, slower queries'],
          ['full_scan_threshold', '10,000', 'Below this, fall back to exact search'],
          ['quantization', 'int8 scalar', '4x memory reduction, <1% recall loss'],
        ]}
      />

      <Callout type="warning" title="Index Build Impact">
        Building indexes on large collections can take hours and consume additional memory.
        Always build indexes in background mode during low-traffic periods.
      </Callout>
    </div>
  );
}

export default Indexes;
