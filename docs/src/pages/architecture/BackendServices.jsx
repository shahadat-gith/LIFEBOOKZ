import { Mermaid } from '../../components/mermaid/Mermaid';
import { Callout } from '../../components/callouts/Callout';
import { CodeBlock } from '../../components/code/CodeBlock';

export function BackendServices() {
  return (
    <div>
      <h1>Backend Services</h1>
      <p>
        Lifebookz follows a <strong>microservice architecture</strong> where each domain has its own
        dedicated service, database collections (where appropriate), and deployment pipeline.
      </p>

      <h2>Service Architecture</h2>
      <Mermaid
        chart={`graph LR
    subgraph Services["Microservices"]
        US[User Service]
        SS[Story Service]
        RS[Recommendation Service]
        AS[AI Enhancement]
        MS[Moderation Service]
        NS[Notification Service]
    end

    subgraph Storage["Data Stores"]
        MDB[(MongoDB)]
        QDR[(Qdrant)]
    end

    US --> MDB
    SS --> MDB
    RS --> QDR
    RS --> MDB
    AS --> QDR
    MS --> MDB
    NS -.->|SQS Events| SS
    US -.->|SQS Events| NS`}
        caption="Microservice architecture with dedicated data stores"
      />

      <h2>Service Breakdown</h2>

      <h3>User Service</h3>
      <p>
        Handles registration, authentication, profile management, and preference collection.
        During registration, user preferences (interests, profession, education, skills, goals,
        languages, location) are embedded and stored in Qdrant for recommendations.
      </p>

      <h3>Story Service</h3>
      <p>
        The core content service. Manages CRUD operations for life stories, diaries, time capsules,
        photos, videos, and audio uploads. Integrates with Cloudinary for media storage and
        triggers moderation events to SQS.
      </p>

      <h3>Recommendation Service</h3>
      <p>
        Computes personalized recommendations by comparing user embeddings with story embeddings
        in Qdrant. Provides community suggestions, mentor matching, and personalized feeds.
      </p>

      <h3>AI Enhancement Service</h3>
      <p>
        Handles AI-powered story improvement. Authors write stories, and AI suggests improvements
        to grammar, flow, structure, and emotional storytelling. Authors must approve all changes.
      </p>

      <h3>Moderation Service</h3>
      <p>
        Reviews all published content for policy compliance. Combines automated AI screening
        with human review for edge cases. Approved stories proceed to the embedding pipeline.
      </p>

      <h3>Notification Service</h3>
      <p>
        Manages push notifications, email digests, and in-app alerts. Triggered by SQS events
        from other services.
      </p>

      <h2>Service Communication</h2>
      <Callout type="tip" title="Synchronous vs Asynchronous">
        <p><strong>Synchronous (REST):</strong> Direct API calls for immediate operations (user CRUD, story CRUD).</p>
        <p><strong>Asynchronous (SQS):</strong> Event-driven for background processing (embedding, moderation, notifications).</p>
      </Callout>

      <h2>Lambda Function Configuration</h2>
      <CodeBlock language="typescript">
{`// Example Lambda function handler
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { MongoClient } from 'mongodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const mongoClient = new MongoClient(process.env.MONGODB_URI!);
const sqs = new SQSClient({ region: process.env.AWS_REGION });

export async function handler(event: APIGatewayProxyEvent, context: Context) {
  // Lambda handler implementation
  const db = mongoClient.db('lifebookz');
  const collection = db.collection('stories');

  // ... business logic ...

  // Send async event to SQS
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.EMBEDDING_QUEUE_URL!,
    MessageBody: JSON.stringify({ storyId, action: 'embed' }),
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
}`}
      </CodeBlock>
    </div>
  );
}

export default BackendServices;
