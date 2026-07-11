import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Callout } from '../../components/callouts/Callout';
import { Table } from '../../components/table/Table';

export function RecommendationEngine() {
  return (
    <div>
      <h1>Recommendation Engine</h1>
      <p>
        The recommendation engine combines <strong>user preference embeddings</strong> with
        <strong>story embeddings</strong> to deliver personalized content, community suggestions,
        and mentor matches. Everything is powered by vector similarity search in Qdrant.
      </p>

      <h2>Recommendation Pipeline</h2>
      <Mermaid
        chart={`flowchart TB
    subgraph Input["Input Vectors"]
        UE[User Embedding\n384-dim]
        SE[Story Embeddings\n384-dim]
    end

    subgraph Qdrant["Qdrant Vector Search"]
        ANN[Approximate\nNearest Neighbor]
        FILTER[Payload Filters\nLanguage, Category]
    end

    subgraph Rank["Ranking Layer"]
        SIM[Cosine Similarity\nScore]
        DIV[Result Diversity\nMMR Algorithm]
        BOOST[Recency & Popularity\nBoost]
    end

    subgraph Output["Recommendation Types"]
        PF[Personalized Feed]
        CS[Community Suggestions]
        MM[Mentor Matches]
        SR[Similar Stories]
    end

    UE --> ANN
    SE --> ANN
    ANN --> FILTER
    FILTER --> SIM
    SIM --> DIV
    DIV --> BOOST
    BOOST --> PF
    BOOST --> CS
    BOOST --> MM
    BOOST --> SR`}
        caption="Recommendation pipeline from vectors to ranked results"
      />

      <h2>Recommendation Types</h2>

      <h3>Personalized Feed</h3>
      <p>
        The user's embedding is used to query Qdrant for the most similar stories. Results are ranked
        by cosine similarity and boosted by recency and popularity signals.
      </p>

      <CodeBlock language="typescript">
{`// Get personalized feed for a user
async function getPersonalizedFeed(
  userId: string,
  options: { limit?: number; offset?: number }
) {
  // Fetch user embedding from Qdrant
  const userVector = await qdrant.getVector(
    'user_embeddings',
    userId
  );

  // Search for similar stories
  const results = await qdrant.search('story_embeddings', {
    vector: userVector,
    limit: options.limit || 20,
    offset: options.offset || 0,
    scoreThreshold: 0.3,
    filter: {
      must: [
        { key: 'language', match: { value: user.preferences.language } },
      ],
      must_not: [
        { key: 'authorId', match: { value: userId } }, // Exclude own stories
      ],
    },
    params: {
      hnsw_ef: 128, // Higher = more accurate but slower
    },
  });

  // Apply ranking boost
  return rankResults(results);
}

function rankResults(results: SearchResult[]) {
  return results
    .map((result) => ({
      ...result,
      score: applyBoosts(result.score, result.payload),
    }))
    .sort((a, b) => b.score - a.score);
}

function applyBoosts(score: number, payload: any) {
  let boosted = score;
  
  // Recency boost: stories published within last 7 days
  const daysSincePublished = daysAgo(payload.publishedAt);
  if (daysSincePublished < 7) {
    boosted *= 1.2;
  }
  
  // Popularity boost
  const popularity = payload.viewCount || 0;
  boosted *= 1 + Math.log10(popularity + 1) * 0.1;
  
  return Math.min(boosted, 1.0); // Cap at 1.0
}`}
      </CodeBlock>

      <h3>Community Suggestions</h3>
      <p>
        Communities are represented as aggregate embeddings computed from the average of all
        member embeddings. Users are recommended communities whose embedding distribution is
        statistically similar to their own.
      </p>

      <h3>Mentor Matching</h3>
      <p>
        Mentors are identified by comparing professional embeddings (profession, skills, education)
        between users. Matches require a minimum similarity threshold and are optionally filtered
        by availability and location.
      </p>

      <h2>Ranking Formula</h2>
      <p>
        The final ranking score combines multiple signals:
      </p>
      <div className="bg-slate-50 rounded-xl p-5 my-4 font-mono text-sm text-slate-700">
        <code>
          score = (cosine_similarity * 0.6) + (recency_boost * 0.2) + (popularity_boost * 0.15) + (diversity_penalty * 0.05)
        </code>
      </div>

      <h2>Performance Characteristics</h2>
      <Table
        headers={['Query Type', 'Qdrant Latency', 'Total Latency', 'Recall@10']}
        rows={[
          ['Personalized Feed', '15ms', '35ms', '0.94'],
          ['Similar Stories', '10ms', '25ms', '0.96'],
          ['Community Suggestions', '20ms', '45ms', '0.91'],
          ['Mentor Matching', '12ms', '30ms', '0.93'],
        ]}
      />

      <Callout type="tip" title="Diversity">
        We use Maximum Marginal Relevance (MMR) to ensure recommendations are diverse. Without it,
        users would see very similar stories repeatedly. MMR trades off relevance for variety.
      </Callout>
    </div>
  );
}

export default RecommendationEngine;
