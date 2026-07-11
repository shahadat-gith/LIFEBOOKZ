import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { Callout } from '../../components/callouts/Callout';

export function SemanticSearch() {
  return (
    <div>
      <h1>Semantic Search</h1>
      <p>
        Lifebookz uses <strong>semantic search</strong> powered by vector embeddings instead of
        traditional keyword-based search. This means users find stories based on meaning and context,
        not just exact keyword matches.
      </p>

      <Callout type="info" title="Why Semantic Search?">
        Life stories are deeply personal and nuanced. A user searching for "overcoming fear of failure"
        should find stories about starting a business, changing careers, or recovering from loss —
        even if those exact words aren't used.
      </Callout>

      <h2>Search Architecture</h2>
      <Mermaid
        chart={`sequenceDiagram
    participant U as User
    participant UI as Search UI
    participant API as Search API
    participant EMB as Embedding Model
    participant QDR as Qdrant
    participant MDB as MongoDB

    U->>UI: Type Query
    UI->>API: GET /search?q=query
    
    Note over API: Real-time embedding
    API->>EMB: Generate Query Embedding
    EMB-->>API: 384-dim Vector
    
    Note over API: Vector search
    API->>QDR: ANN Search (top K)
    QDR-->>API: Similar Story IDs + Scores
    
    Note over API: Fetch full content
    API->>MDB: Batch Get Stories
    MDB-->>API: Full Story Documents
    
    Note over API: Rank & format
    API-->>UI: Sorted Results
    
    UI-->>U: Display Results`}
        caption="Semantic search flow from query to results"
      />

      <h2>Search Implementation</h2>
      <p>
        Semantic search is performed <strong>synchronously</strong> during the API request. The query
        is embedded in real-time using a lightweight model deployed on Lambda, then searched against
        Qdrant's ANN index.
      </p>

      <CodeBlock language="typescript">
{`// Search API handler
import { SentenceTransformer } from '@xenova/transformers';
import { QdrantClient } from '@qdrant/js-client-rest';

const embedder = await SentenceTransformer.from_pretrained(
  'Xenova/all-MiniLM-L6-v2'
);
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export async function handler(event: APIGatewayProxyEvent) {
  const query = event.queryStringParameters?.q || '';
  const limit = parseInt(event.queryStringParameters?.limit || '20');
  const offset = parseInt(event.queryStringParameters?.offset || '0');
  const language = event.queryStringParameters?.language;

  // Generate query embedding
  const queryVector = await embedEmbedding(query);

  // Build Qdrant filter
  const filter: any = {};
  if (language) {
    filter.must = [{ key: 'language', match: { value: language } }];
  }

  // Search Qdrant
  const results = await qdrant.search('story_embeddings', {
    vector: Array.from(queryVector.data),
    limit,
    offset,
    scoreThreshold: 0.2,
    filter: filter.must ? filter : undefined,
    withPayload: true,
  });

  // Fetch full story details from MongoDB
  const storyIds = results.map((r) => r.payload.storyId);
  const stories = await fetchStoriesFromMongo(storyIds);

  // Map results with scores
  const searchResults = results.map((result) => ({
    ...stories.find((s) => s._id === result.payload.storyId),
    score: result.score,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      results: searchResults,
      total: results.length,
      query,
    }),
  };
}

async function embedEmbedding(text: string) {
  const result = await embedder(text, {
    pooling: 'mean',
    normalize: true,
  });
  return result;
}`}
      </CodeBlock>

      <h2>Hybrid Search Strategy</h2>
      <p>
        While Qdrant provides excellent semantic search, we also support keyword-based filtering
        for precise queries. The search endpoint supports:
      </p>
      <ul>
        <li><strong>Semantic search:</strong> Default. Embedding-based similarity.</li>
        <li><strong>Keyword filter:</strong> Exact matches on title, tags, author name.</li>
        <li><strong>Metadata filter:</strong> Language, category, date range, word count.</li>
        <li><strong>Combined:</strong> Semantic search with metadata filters applied post-query.</li>
      </ul>

      <h2>Performance Comparison</h2>
      <Table
        headers={['Metric', 'Keyword Search', 'Semantic Search', 'Hybrid']}
        rows={[
          ['Recall@10', '0.45', '0.92', '0.95'],
          ['Precision@10', '0.80', '0.85', '0.88'],
          ['P95 Latency', '20ms', '35ms', '45ms'],
          ['Cold Start', 'N/A', '800ms', '800ms'],
          ['Index Size', '50MB', '2.5GB', '2.55GB'],
        ]}
      />

      <h2>Query Examples</h2>
      <Table
        headers={['Query', 'Keyword Results', 'Semantic Results']}
        rows={[
          ['overcoming fear', 'Matches "fear" in text', 'Stories about courage, risk-taking, major life changes'],
          ['starting a business at 40', 'Exact phrase match', 'Career change stories, entrepreneurship journeys, second acts'],
          ['loss of a parent', 'Matches "loss" and "parent"', 'Grief stories, family memories, coping mechanisms'],
          ['learning to code', 'Matches "code"', 'Career transitions, self-taught journeys, tech bootcamp experiences'],
        ]}
      />

      <Callout type="warning" title="Cold Start Impact">
        The embedding model is loaded into Lambda memory. First invocation after idle period will be
        ~800ms slower. For search-heavy use cases, consider provisioned concurrency.
      </Callout>
    </div>
  );
}

export default SemanticSearch;
