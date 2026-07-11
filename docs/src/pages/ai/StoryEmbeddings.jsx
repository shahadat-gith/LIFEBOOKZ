import { Mermaid } from '../../components/mermaid/Mermaid';
import { Callout } from '../../components/callouts/Callout';
import { CodeBlock } from '../../components/code/CodeBlock';

export function StoryEmbeddings() {
  return (
    <div>
      <h1>Story Embeddings</h1>
      <p>
        Story embeddings are generated <strong>asynchronously</strong>. When an author publishes a story,
        it goes through moderation first. Only after approval is the story embedded and stored in Qdrant.
        Stories are <strong>never</strong> embedded during API requests.
      </p>

      <Callout type="info" title="Async-First Design">
        Embedding generation is computationally expensive. By moving it to a background worker, we ensure
        consistent API response times regardless of embedding model performance.
      </Callout>

      <h2>The Embedding Pipeline</h2>
      <Mermaid
        chart={`flowchart TB
    subgraph Author["Author Workflow"]
        WRITE[Write Story]
        PUBLISH[Publish]
    end

    subgraph Sync["Synchronous (API Request)"]
        SAVE[Save to MongoDB]
    end

    subgraph Moderation["Moderation Pipeline"]
        MOD[Moderation Service]
        REJECT[Rejected]
        APPROVE[Approved]
    end

    subgraph Async["Asynchronous (Background)"]
        SQS[SQS: Embedding Queue]
        WORKER[Embedding Worker\nLambda]
        HUG[HuggingFace\nEmbedding Model]
        QDR[(Qdrant Vector DB)]
    end

    subgraph Notification["Completion"]
        NOTIFY[Notify Author]
    end

    WRITE --> PUBLISH
    PUBLISH --> SAVE
    SAVE --> MOD
    MOD -->|Policy Violation| REJECT
    MOD -->|Passed| APPROVE
    APPROVE --> SQS
    SQS --> WORKER
    WORKER --> HUG
    HUG --> QDR
    QDR --> NOTIFY`}
        caption="Complete story embedding pipeline from writing to vector storage"
      />

      <h2>Pipeline Steps</h2>

      <h3>1. Story Publication</h3>
      <p>
        The author writes and publishes a story. The story is saved to MongoDB and a moderation event
        is enqueued to the moderation SQS queue.
      </p>

      <h3>2. Moderation Approval</h3>
      <p>
        The moderation service reviews the story for policy compliance. The combination of automated
        AI screening and human review ensures quality. Approved stories trigger the embedding pipeline.
      </p>

      <h3>3. SQS Event</h3>
      <p>
        Upon approval, an event is sent to the <strong>embedding queue</strong> with the story ID.
        This decouples the embedding process from the API request lifecycle.
      </p>

      <CodeBlock language="typescript">
{`// Enqueue embedding event after moderation approval
async function onModerationApproval(storyId: string) {
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.EMBEDDING_QUEUE_URL,
    MessageBody: JSON.stringify({
      eventType: 'story.embed',
      storyId,
      timestamp: new Date().toISOString(),
    }),
    MessageGroupId: storyId, // Ensure FIFO ordering
  }));
}`}
      </CodeBlock>

      <h3>4. Embedding Worker</h3>
      <p>
        The embedding worker Lambda polls the SQS queue, fetches the story from MongoDB, generates
        embeddings using the HuggingFace model, and stores them in Qdrant.
      </p>

      <CodeBlock language="python">
{`# Embedding worker Lambda handler
import json
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
import boto3

model = SentenceTransformer('all-MiniLM-L6-v2')
qdrant = QdrantClient(url=os.environ['QDRANT_URL'])
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['STORIES_TABLE'])

def handler(event, context):
    for record in event['Records']:
        body = json.loads(record['body'])
        story_id = body['storyId']
        
        # Fetch story from MongoDB
        story = get_story_from_mongo(story_id)
        
        # Generate content for embedding
        content = f"{story['title']}\\n\\n{story['content']}"
        
        # Create embedding
        embedding = model.encode(content).tolist()
        
        # Store in Qdrant
        qdrant.upsert(
            collection_name='story_embeddings',
            points=[{
                'id': story_id,
                'vector': embedding,
                'payload': {
                    'title': story['title'],
                    'authorId': story['authorId'],
                    'language': story.get('language', 'en'),
                    'category': story.get('category', 'general'),
                    'publishedAt': story['publishedAt'],
                }
            }]
        )
    
    return {'statusCode': 200, 'batchItemFailures': []}`}
      </CodeBlock>

      <h3>5. Vector Storage</h3>
      <p>
        The embedding vector (384 dimensions) is stored in Qdrant with associated metadata payload.
        This enables semantic search, recommendations, and similarity matching.
      </p>

      <h2>Qdrant Collection Schema</h2>
      <CodeBlock language="typescript">
{`// Qdrant story embeddings collection
const storyCollectionConfig = {
  collectionName: 'story_embeddings',
  vectors: {
    size: 384,
    distance: 'Cosine',
  },
  payloadSchema: {
    storyId: { type: 'keyword', indexed: true },
    title: { type: 'text', indexed: true },
    authorId: { type: 'keyword', indexed: true },
    language: { type: 'keyword', indexed: true },
    category: { type: 'keyword', indexed: true },
    tags: { type: 'keyword', indexed: true },
    publishedAt: { type: 'datetime' },
    wordCount: { type: 'integer' },
  },
};`}
      </CodeBlock>

      <Callout type="warning" title="Key Constraint">
        Stories are <strong>never</strong> embedded during API requests. The async pipeline ensures
        consistent performance regardless of embedding model load or latency.
      </Callout>
    </div>
  );
}

export default StoryEmbeddings;
