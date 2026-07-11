import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { Callout } from '../../components/callouts/Callout';

export function Qdrant() {
  return (
    <div>
      <h1>Qdrant Vector Database</h1>
      <p>
        Qdrant is our <strong>vector database</strong> for storing and searching embeddings. It powers
        semantic search, recommendations, and similarity matching across users, stories, and media.
      </p>

      <h2>Cluster Architecture</h2>
      <Mermaid
        chart={`graph TB
    subgraph QdrantCloud["Qdrant Cloud Cluster"]
        subgraph Shard0["Shard 0"]
            S0P[Primary]
            S0R1[Replica 1]
            S0R2[Replica 2]
        end
        subgraph Shard1["Shard 1"]
            S1P[Primary]
            S1R1[Replica 1]
            S1R2[Replica 2]
        end
        subgraph Shard2["Shard 2"]
            S2P[Primary]
            S2R1[Replica 1]
            S2R2[Replica 2]
        end
    end

    subgraph Collections["Collections"]
        UE[user_embeddings\n384-dim, Cosine]
        SE[story_embeddings\n384-dim, Cosine]
        ME[media_embeddings\n512-dim, Cosine]
    end

    subgraph Clients["Services"]
        RS[Recommendation Service]
        SS[Semantic Search]
        EW[Embedding Worker]
    end

    RS --> UE
    RS --> SE
    SS --> SE
    EW --> UE
    EW --> SE
    EW --> ME

    UE --> Shard0
    UE --> Shard1
    SE --> Shard0
    SE --> Shard2
    ME --> Shard1
    ME --> Shard2`}
        caption="Qdrant cluster with sharded collections"
      />

      <h2>Collections</h2>

      <Table
        headers={['Collection', 'Vector Size', 'Distance', 'Records (est.)', 'Shards']}
        rows={[
          ['user_embeddings', '384', 'Cosine', '100,000', '2'],
          ['story_embeddings', '384', 'Cosine', '500,000', '3'],
          ['media_embeddings', '512', 'Cosine', '250,000', '2'],
        ]}
      />

      <h2>Search Configuration</h2>
      <p>
        Qdrant uses <strong>HNSW (Hierarchical Navigable Small World)</strong> indexes for
        approximate nearest neighbor search. Configuration is tuned for sub-10ms query latency:
      </p>

      <CodeBlock language="typescript">
{`// Qdrant collection configuration
const searchConfig = {
  // HNSW index parameters
  hnsw: {
    m: 16,              // Number of bi-directional links (higher = better recall, more memory)
    ef_construct: 128,   // Dynamic candidate list size during indexing
    full_scan_threshold: 10000,  // Threshold for switching to full scan
    max_indexing_threads: 4,
  },
  // Optimizer settings
  optimizer: {
    default_segment_number: 2,
    memmap_threshold_kb: 200000,  // 200MB - use memory-mapped files for large segments
    indexing_threshold: 20000,     // Start indexing after 20K points
    flush_interval_sec: 5,
  },
  // WAL (Write-Ahead Log) configuration
  wal: {
    wal_capacity_mb: 1024,
    wal_segments_ahead: 0,
  },
  // Quantization for memory efficiency
  quantization: {
    scalar: {
      type: 'int8',
      quantile: 0.95,
      always_ram: true,
    },
  },
};

// Search parameters
const searchParams = {
  limit: 20,
  offset: 0,
  scoreThreshold: 0.2,
  params: {
    hnsw_ef: 128,      // Search width (higher = better recall, higher latency)
    exact: false,       // Use ANN, not exact search
  },
};`}
      </CodeBlock>

      <h2>Payload Indexes</h2>
      <p>
        Payload fields used in filters are indexed for fast filtering:
      </p>

      <Table
        headers={['Collection', 'Indexed Fields', 'Type', 'Filter Queries']}
        rows={[
          ['user_embeddings', 'userId, interests, languages', 'Keyword', 'Filter by language, interest group'],
          ['story_embeddings', 'authorId, language, category, tags', 'Keyword', 'Filter by language, category, author'],
          ['story_embeddings', 'publishedAt', 'Integer', 'Date range filtering'],
          ['media_embeddings', 'mediaType, storyId', 'Keyword', 'Filter by type or parent story'],
        ]}
      />

      <h2>Query Patterns</h2>

      <CodeBlock language="typescript">
{`// Example: Semantic search with filtering
async function semanticSearch(
  queryVector: number[],
  options: {
    language?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }
) {
  const filter: any = {};
  
  if (options.language) {
    filter.must = [{ key: 'language', match: { value: options.language } }];
  }
  if (options.category) {
    filter.must = [
      ...(filter.must || []),
      { key: 'category', match: { value: options.category } },
    ];
  }

  const results = await qdrant.search('story_embeddings', {
    vector: queryVector,
    limit: options.limit || 20,
    offset: options.offset || 0,
    filter: filter.must ? filter : undefined,
    withPayload: ['title', 'authorId', 'publishedAt'],
  });

  return results.map((r) => ({
    storyId: r.id,
    score: r.score,
    payload: r.payload,
  }));
}

// Example: Get similar stories to a given story
async function getSimilarStories(storyId: string, limit = 10) {
  const target = await qdrant.getPoints('story_embeddations', {
    ids: [storyId],
  });

  if (!target.points.length) throw new Error('Story not found');

  const results = await qdrant.search('story_embeddings', {
    vector: target.points[0].vector,
    limit: limit + 1, // +1 to exclude the query story
  });

  // Exclude the query story from results
  return results.filter((r) => r.id !== storyId).slice(0, limit);
}`}
      </CodeBlock>

      <h2>Monitoring</h2>
      <p>
        Key metrics tracked for Qdrant performance:
      </p>
      <ul>
        <li><strong>Query latency:</strong> P50/P95/P99 search times</li>
        <li><strong>Recall@10:</strong> Fraction of true nearest neighbors in top 10 results</li>
        <li><strong>Segment count:</strong> Number of segments (too many = slow optimization)</li>
        <li><strong>Memory usage:</strong> RAM vs disk-mapped vector access</li>
        <li><strong>Optimizer status:</strong> Currently optimizing segments</li>
      </ul>

      <Callout type="info" title="Why Qdrant?">
        We chose Qdrant for its excellent performance, built-in payload filtering, quantization
        support, and managed cloud offering. It provides sub-10ms query latency at 95th percentile
        with 500K+ vectors.
      </Callout>
    </div>
  );
}

export default Qdrant;
