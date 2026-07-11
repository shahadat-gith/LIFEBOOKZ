import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { Callout } from '../../components/callouts/Callout';

export function Workers() {
  return (
    <div>
      <h1>Background Workers</h1>
      <p>
        Background workers are <strong>Lambda functions triggered by SQS events</strong>. They handle
        asynchronous processing tasks that don't need to complete within the API request lifecycle.
      </p>

      <h2>Worker Architecture</h2>
      <Mermaid
        chart={`graph TB
    subgraph Triggers["Event Triggers"]
        SQS[SQS Queues]
    end

    subgraph Workers["Lambda Workers"]
        EW[Embedding Worker]
        MW[Moderation Worker]
        NW[Notification Worker]
        DW[Digest Worker]
        CW[Cleanup Worker]
    end

    subgraph Resources["Resources Accessed"]
        MDB[(MongoDB)]
        QDR[(Qdrant)]
        AI[AI Models\nOpenRouter/HuggingFace]
        EMAIL[Email Service\nSES]
        PUSH[Push Notifications\nSNS]
        CL[Cloudinary]
    end

    subgraph Observability["Monitoring"]
        CW[CloudWatch Logs]
        XR[X-Ray Traces]
        AL[Alarms]
    end

    SQS --> EW
    SQS --> MW
    SQS --> NW
    SQS --> DW
    SQS --> CW

    EW --> MDB
    EW --> QDR
    EW --> AI
    MW --> MDB
    MW --> AI
    NW --> EMAIL
    NW --> PUSH
    DW --> MDB
    CW --> CL
    CW --> MDB

    Workers --> Observability`}
        caption="Background worker architecture with resource dependencies"
      />

      <h2>Worker Breakdown</h2>

      <Table
        headers={['Worker', 'Trigger', 'Function', 'Avg Duration', 'Memory']}
        rows={[
          ['Embedding Worker', 'Embedding Queue', 'Generate & store story embeddings', '1.5s', '1024MB'],
          ['Moderation Worker', 'Moderation Queue', 'Review content for policy compliance', '3s', '512MB'],
          ['Notification Worker', 'Notification Queue', 'Send push & email notifications', '500ms', '256MB'],
          ['Digest Worker', 'Scheduled (daily)', 'Compile & send email digests', '30s', '512MB'],
          ['Cleanup Worker', 'Scheduled (hourly)', 'Clean up expired sessions & temp files', '10s', '256MB'],
        ]}
      />

      <h3>Embedding Worker</h3>
      <p>
        The most compute-intensive worker. It fetches approved stories from MongoDB, generates
        embeddings using HuggingFace sentence-transformers, and stores them in Qdrant. Configured
        with 1024MB memory to accommodate the ML model.
      </p>

      <CodeBlock language="yaml">
{`# SAM template for embedding worker
EmbeddingWorker:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: workers/embedding/
    Handler: index.handler
    Runtime: python3.12
    MemorySize: 1024
    Timeout: 300
    Layers:
      - !Ref SentenceTransformerLayer
    Events:
      SQSEvent:
        Type: SQS
        Properties:
          Queue: !GetAtt EmbeddingQueue.Arn
          BatchSize: 5
          MaximumBatchingWindowInSeconds: 10
    Policies:
      - SQSPollerPolicy:
          QueueName: !Ref EmbeddingQueue
      - DynamoDBReadPolicy:
          TableName: !Ref StoriesTable
      - QdrantWritePolicy: {}`}
      </CodeBlock>

      <h3>Moderation Worker</h3>
      <p>
        Uses AI to screen stories for policy violations. Combines a fast classifier for initial
        screening with LLM-based review for nuanced cases. Stories flagged by the AI are routed
        to human reviewers.
      </p>

      <h3>Notification Worker</h3>
      <p>
        Handles all outbound communications. Subscribes to notification SQS events and sends:
        push notifications via SNS, email via SES, and in-app notifications stored in MongoDB.
      </p>

      <h2>Configuration & Monitoring</h2>

      <h3>Error Handling</h3>
      <p>
        Each worker implements a consistent error handling pattern:
      </p>
      <ul>
        <li>Exceptions are caught and logged to CloudWatch</li>
        <li>Failed messages are returned to SQS as <code>batchItemFailures</code></li>
        <li>After 3 retries, messages move to the Dead Letter Queue</li>
        <li>A daily DLQ processor analyzes failures and alerts the team</li>
      </ul>

      <h3>Provisioned Concurrency</h3>
      <p>
        Workers with latency sensitivity (moderation, embedding) can use provisioned concurrency
        to avoid cold starts. The embedding worker is the main candidate due to its ML model
        initialization cost (~2 seconds).
      </p>

      <CodeBlock language="typescript">
{`// Worker error handling pattern
export async function handler(event: SQSEvent) {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      await processMessage(body);
    } catch (error) {
      console.error('Failed to process message:', {
        messageId: record.messageId,
        error: error.message,
        attempt: record.attributes.ApproximateReceiveCount,
      });

      // Return failed message for retry
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  return { batchItemFailures };
}`}
      </CodeBlock>

      <Callout type="warning" title="At-Least-Once Delivery">
        SQS standard queues deliver messages at least once. Workers must be idempotent —
        processing the same message twice should produce the same result. Use the story ID or
        message deduplication ID to prevent duplicate processing.
      </Callout>
    </div>
  );
}

export default Workers;
